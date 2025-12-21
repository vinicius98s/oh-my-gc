import os
import pytesseract
import cv2
import mss
import pywinctl as pwc
import numpy as np
import re
import win32gui
import win32ui
import win32con
import ctypes
from rapidfuzz import fuzz

from utils import parse_args


args = parse_args()
if args.TESSERACT_PATH:
    pytesseract.pytesseract.tesseract_cmd = args.TESSERACT_PATH


TEMPLATES_BASE_PATH = args.templates


def load_templates(path, gray=False):
    templates = []
    for (dirpath, dirnames, filenames) in os.walk(path):
        for filename in filenames:
            character_name = filename.replace(".png", "")
            if gray:
                templates.append(
                    (character_name, cv2.imread(
                        f"{path}/{filename}", cv2.IMREAD_GRAYSCALE))
                )
            else:
                templates.append(
                    (character_name, cv2.imread(f"{path}/{filename}")))
    return templates


LOBBY_CHARACTER_TEMPLATES = load_templates(
    os.path.join(TEMPLATES_BASE_PATH, "characters"))
INGAME_CHARACTER_TEMPLATES = load_templates(
    os.path.join(TEMPLATES_BASE_PATH, "characters", "in-game"))
DUNGEON_TEMPLATES = load_templates(
    os.path.join(TEMPLATES_BASE_PATH, "dungeons"), gray=True)


class GameState:
    def __init__(self, character_id, img, DB, broadcaster):
        self.img = img
        self.character_id = character_id
        self.DB = DB
        self.broadcaster = broadcaster

    def __str__(self):
        return f"GameState(\n\tcharacter_id={self.character_id}\n)"

    def match_completed_dungeon(self, entry_id, dungeon_id):
        if self.match_lobby_character():
            if dungeon_id in [5, 6]:
                self.complete_dungeon_entry(entry_id)

            return True
        else:
            x, y, w, h = (565, 495, 800, 90)
            roi = self.img[y:y+h, x:x+w]
            hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
            lower_yellow = np.array([20, 100, 100])
            upper_yellow = np.array([35, 255, 255])
            mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
            result = cv2.bitwise_and(roi, roi, mask=mask)
            gray = cv2.cvtColor(result, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(
                gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            text = pytesseract.image_to_string(
                thresh, config="--oem 3 --psm 6")

            if self.is_dungeon_completed(text):
                self.complete_dungeon_entry(entry_id)
                return True

            return False

    def complete_dungeon_entry(self, entry_id):
        cursor = self.DB.cursor()
        update = """
            UPDATE dungeons_entries
            SET finished_at = CURRENT_TIMESTAMP, character_id = ?
            WHERE id = ?
        """
        cursor.execute(update, (self.character_id, entry_id))
        self.DB.commit()
        self.broadcaster.broadcast(
            event="dungeons",
            data={"type": "completed", "dungeon_entry_id": entry_id}
        )

    def match_completed_text(self, text):
        match = fuzz.partial_ratio(text, "COMPLETE")
        if (
            text.startswith("COMP") or
            text.endswith("LETE") or
            match >= 80
        ):
            return True
        return False

    def match_failed_text(self, text):
        match = fuzz.partial_ratio(text, "FAILED")
        if (
            text.startswith("FAIL") or
            text.endswith("ILED") or
            match >= 80
        ):
            return True
        return False

    def is_dungeon_completed(self, text):
        if self.match_failed_text(text) or self.match_completed_text(text):
            return True

        return False

    def match_playing_character(self):
        x, y, w, h = (65, 10, 180, 150)
        roi = self.img[y:y+h, x:x+w]

        character_match = (0, "")

        for (character_name, template) in INGAME_CHARACTER_TEMPLATES:
            res = cv2.matchTemplate(roi, template, cv2.TM_CCOEFF_NORMED)
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)
            if max_val > character_match[0]:
                character_match = (max_val, character_name)

        threshold = 0.80
        confidence = character_match[0]
        if confidence < 1 and confidence > threshold:
            character = character_match[1]
            cursor = self.DB.cursor()
            character_id = cursor.execute(
                "SELECT id FROM characters WHERE name = ?",
                (character,)).fetchone()[0]
            self.character_id = character_id
            return character_id

    def match_loading_dungeon(self, character_id):
        if self.match_playing_character() is None:
            x, y, w, h = (500, 100, 980, 670)
            roi = cv2.cvtColor(self.img[y:y + h, x:x + w], cv2.COLOR_BGR2GRAY)

            best_match = (0, "")
            second_best_match = (0, "")

            for (dungeon_name, template) in DUNGEON_TEMPLATES:
                res = cv2.matchTemplate(roi, template, cv2.TM_CCOEFF_NORMED)
                min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)

                if max_val > best_match[0]:
                    second_best_match = best_match
                    best_match = (max_val, dungeon_name)
                elif max_val > second_best_match[0]:
                    second_best_match = (max_val, dungeon_name)

            threshold = 0.80
            confidence = best_match[0]
            confidence_gap = confidence - second_best_match[0]

            min_gap = 0.05

            if confidence > threshold and confidence_gap >= min_gap:
                dungeon = best_match[1]
                cursor = self.DB.cursor()
                cursor.execute(
                    "DELETE FROM dungeons_entries WHERE finished_at IS NULL")
                dungeon_id = cursor.execute(
                    "SELECT id FROM dungeons WHERE name = ?",
                    (dungeon,)
                ).fetchone()[0]
                entry_id = cursor.execute(
                    "INSERT INTO dungeons_entries (dungeon_id, character_id) VALUES (?, ?) RETURNING id",
                    (dungeon_id, character_id)
                ).fetchone()[0]
                self.DB.commit()
                self.broadcaster.broadcast(
                    event="dungeons",
                    data={"type": "start", "dungeon": dungeon}
                )

                return (entry_id, dungeon_id)

    def match_lobby_character(self):
        x, y, w, h = (18, 1020, 75, 55)
        roi = self.img[y:y+h, x:x+w]

        if np.std(roi) < 10:
            return False

        character_match = (0, "")

        for (character_name, template) in LOBBY_CHARACTER_TEMPLATES:
            res = cv2.matchTemplate(roi, template, cv2.TM_CCOEFF_NORMED)
            min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)
            if max_val > character_match[0]:
                character_match = (max_val, character_name)

        threshold = 0.75
        confidence = character_match[0]
        if confidence > threshold:
            character = character_match[1]
            cursor = self.DB.cursor()
            character_id = cursor.execute(
                "SELECT id FROM characters WHERE name = ?",
                (character,)).fetchone()[0]
            self.broadcaster.broadcast(
                event="dungeons",
                data={"type": "not_playing"}
            )
            self.character_id = character_id
            return character_id

        return None


def get_window():
    try:
        title = re.compile(r"GrandChase v\.\d+\.\d+\.\d+ x\d+")
        windows = pwc.getWindowsWithTitle(title, None, pwc.Re.MATCH)
        if len(windows) == 0:
            return
        return windows[0]
    except Exception as e:
        print('\n[get_window]:', e)
        return


def capture_template(template_name, template_type):
    with mss.mss() as sct:
        if template_type == "characters":
            x, y, w, h = (18, 1020, 75, 55)
        elif template_type == "dungeon":
            x, y, w, h = (500, 100, 980, 670)
        elif template_type == "in-game":
            x, y, w, h = (65, 10, 180, 150)
        else:
            raise Exception("Invalid template type")

        if template_type == "in-game":
            path = f"{args.templates}/characters/in-game/{template_name}.png"
        else:
            path = f"{args.templates}/{template_type}/{template_name}.png"

        screenshot = sct.grab({
            "top": y,
            "left": x,
            "width": w,
            "height": h
        })
        mss.tools.to_png(screenshot.rgb, screenshot.size, output=path)


def take_screenshot(window, image_path):
    hwnd = window.getHandle()

    # Get the client area size
    client_rect = win32gui.GetClientRect(hwnd)
    w = client_rect[2]
    h = client_rect[3]

    if w <= 0 or h <= 0:
        return None

    # Get the screen coordinates of the top-left corner of the client area
    top_left = win32gui.ClientToScreen(hwnd, (0, 0))
    x, y = top_left

    with mss.mss() as sct:
        # Capture the specified region
        screenshot = sct.grab({
            "top": y,
            "left": x,
            "width": w,
            "height": h
        })

        # Convert to numpy array (BGRA format)
        img = np.array(screenshot)

    # Convert from BGRA to BGR for OpenCV
    img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

    # Maintain the 1920x1080 target resolution for template matching
    if img.shape[0] != 1080 or img.shape[1] != 1920:
        img = cv2.resize(img, (1920, 1080))

    cv2.imwrite(image_path, img)

    return img
