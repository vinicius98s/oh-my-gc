import os
import pytesseract
import cv2
import mss
import pywinctl as pwc
import numpy as np
import re
import win32gui
from rapidfuzz import fuzz

from utils import parse_args
import database
import time


LAST_FLOOR_UPDATE = {}


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
    def __init__(self, character_id, img, DB, broadcaster, has_penalty=False):
        self.img = img
        self.character_id = character_id
        self.DB = DB
        self.broadcaster = broadcaster
        self.has_penalty = has_penalty

    def __str__(self):
        return f"GameState(\n\tcharacter_id={self.character_id}\n\thas_penalty={self.has_penalty}\n)"

    def match_ongoing_dungeon(self, entry_id, dungeon_id):
        if self.match_lobby_character():
            if dungeon_id in [5, 6]:
                # Lobby completion is always considered a success for these specific dungeons
                self.complete_dungeon_entry(entry_id, dungeon_id)
            else:
                cursor = self.DB.cursor()
                cursor.execute("DELETE FROM dungeons_entries WHERE finished_at IS NULL")
                self.DB.commit()

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

            if dungeon_id in [10, 11, 12]:
                if self.match_boss_dead():
                    now = time.time()
                    if entry_id not in LAST_FLOOR_UPDATE or now - LAST_FLOOR_UPDATE[entry_id] > 20:
                        cursor = self.DB.cursor()
                        cursor.execute("UPDATE dungeons_entries SET floor = COALESCE(floor, 0) + 1 WHERE id = ?", (entry_id,))
                        self.DB.commit()
                        LAST_FLOOR_UPDATE[entry_id] = now
                        print(f"[GameState]: Boss dead detected! Floor increased for entry {entry_id}.")

            if self.is_dungeon_completed(text):
                self.complete_dungeon_entry(entry_id, dungeon_id)
                return True

            return False

    def complete_dungeon_entry(self, entry_id, dungeon_id):
        if entry_id is None:
            return

        cursor = self.DB.cursor()

        cursor.execute("SELECT has_penalty, floor FROM dungeons_entries WHERE id = ?", (entry_id,))
        res = cursor.fetchone()
        has_penalty = res[0] if res else False
        floor = res[1] if res and res[1] is not None else 1

        update = """
            UPDATE dungeons_entries
            SET finished_at = CURRENT_TIMESTAMP, character_id = ?
            WHERE id = ?
        """
        cursor.execute(update, (self.character_id, entry_id))
        self.DB.commit()

        # Grant items if the dungeon was actually completed (not failed) AND no penalty was active
        if not has_penalty:
            if dungeon_id == 13:
                database.grant_inventory_item(self.DB, self.character_id, 1, 2)
            elif dungeon_id == 14:
                database.grant_inventory_item(self.DB, self.character_id, 2, 3)
            elif dungeon_id in [10, 11, 12]:
                database.grant_void_rewards(self.DB, self.character_id, dungeon_id, floor)

        self.broadcaster.broadcast(
            event="dungeons",
            data={"type": "completed_dungeon"}
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

    def match_loading_dungeon(self, character_id, has_penalty):
        if self.match_playing_character() is None:
            x, y, w, h = (500, 100, 980, 670)
            roi = cv2.cvtColor(self.img[y:y + h, x:x + w], cv2.COLOR_BGR2GRAY)

            best_match = (0, "")

            for (dungeon_name, template) in DUNGEON_TEMPLATES:
                res = cv2.matchTemplate(roi, template, cv2.TM_CCOEFF_NORMED)
                min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)

                if max_val > best_match[0]:
                    best_match = (max_val, dungeon_name)

            threshold = 0.80
            confidence = best_match[0]

            if confidence > threshold:
                dungeon = best_match[1]
                cursor = self.DB.cursor()
                cursor.execute(
                    "DELETE FROM dungeons_entries WHERE finished_at IS NULL")
                dungeon_id = cursor.execute(
                    "SELECT id FROM dungeons WHERE name = ?",
                    (dungeon,)
                ).fetchone()[0]
                floor = 1 if dungeon_id in [10, 11, 12] else None
                entry_id = cursor.execute(
                    "INSERT INTO dungeons_entries (dungeon_id, character_id, has_penalty, floor) VALUES (?, ?, ?, ?) RETURNING id",
                    (dungeon_id, character_id, has_penalty, floor)
                ).fetchone()[0]
                self.DB.commit()
                self.broadcaster.broadcast(
                    event="dungeons",
                    data={"type": "started_dungeon", "dungeon_id": dungeon_id}
                )
                return (entry_id, dungeon_id)

        return None

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
            self.has_penalty = self.match_penalty_text()
            return character_id

        return None

    def match_penalty_text(self):
        x, y, w, h = (1376, 441, 478, 90)
        roi = self.img[y:y+h, x:x+w]

        # Convert to HSV for color masking
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

        # Color range for the red/orange penalty text
        # Using two ranges for red (it wraps around in HSV)
        lower_red1 = np.array([0, 150, 150])
        upper_red1 = np.array([15, 255, 255])
        lower_red2 = np.array([165, 150, 150])
        upper_red2 = np.array([179, 255, 255])

        mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        mask = mask1 | mask2

        # Dilate the mask slightly to close gaps in letters
        kernel = np.ones((2, 2), np.uint8)
        mask = cv2.dilate(mask, kernel, iterations=1)

        # Bitwise-AND mask and original image to isolate the text
        result = cv2.bitwise_and(roi, roi, mask=mask)

        # Convert to grayscale
        gray = cv2.cvtColor(result, cv2.COLOR_BGR2GRAY)

        # Use simple binary thresholding
        _, thresh = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)

        # Resize thresh to make text larger for OCR
        thresh = cv2.resize(thresh, None, fx=2, fy=2,
                            interpolation=cv2.INTER_CUBIC)

        # OCR
        text = pytesseract.image_to_string(thresh, config="--oem 3 --psm 6")
        if len(text.strip()) < 10:
            text = pytesseract.image_to_string(thresh, config="--oem 3 --psm 3")

        if not text:
            return False

        # Keywords to check
        keywords = [
            "daily runs have been exceeded",
            "weekly play count",
            "penalty has been applied",
            "penalty in rewards",
            "exceeded",
            "penalty"
        ]

        for kw in keywords:
            if fuzz.partial_ratio(text.lower(), kw) >= 75:
                return True

        return False

    def has_colors(self, roi, color_ranges):
        """
        Generic helper to check if an ROI contains any of the specified color ranges.
        color_ranges: list of tuples ((lower_hsv), (upper_hsv))
        """
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        for (lower, upper) in color_ranges:
            lower = np.array(lower)
            upper = np.array(upper)
            mask = cv2.inRange(hsv, lower, upper)
            if cv2.countNonZero(mask) > (roi.shape[0] * roi.shape[1] * 0.05): # At least 5% of pixels
                return True
        return False

    def match_boss_dead(self):
        """
        Detects if the boss is dead by checking for 'x0' text and empty health bar.
        """
        # ROI for boss health bar (centered at the top, based on 1920x1080)
        x, y, w, h = (439, 999, 1139, 45)
        roi = self.img[y:y+h, x:x+w]

        # 1. Color Check
        # Alive or non-dead colors: 
        # - Cyan/Blue (Saturation > 80, centered on Cyan Hue 90)
        # - Purple/Magenta (Hue 140-170, Saturation > 50)
        # - Yellow/Orange (Hue 15-45, Saturation > 50)
        # - Red (Hue 0-10 or 160-180, Saturation > 50)
        # - Very Bright / White (Value > 230, Saturation < 50)
        # NOTE: We use Value (brightness) >= 150 to avoid rejecting dark backgrounds/patterns
        alive_color_ranges = [
            ([85, 80, 150], [115, 255, 255]),  # Blue/Cyan
            ([140, 50, 150], [175, 255, 255]), # Purple/Magenta
            ([15, 50, 150], [45, 255, 255]),   # Yellow/Orange
            ([0, 50, 150], [10, 255, 255]),    # Red (Lower)
            ([170, 50, 150], [180, 255, 255]), # Red (Upper)
            ([0, 0, 230], [180, 50, 255]),    # Very Bright/White (Glow)
        ]
        
        h_roi, w_roi = roi.shape[:2]
        # Check central part of the health bar, biased to the right to avoid portraits
        # Rows: 35% to 65% (Tight middle)
        # Columns: 30% to 80% (Middle section after portrait)
        bar_check_roi = roi[int(h_roi*0.35):int(h_roi*0.65), int(w_roi*0.3):int(w_roi*0.8)]
        
        # If any alive or invalid colors are dominant, it's definitely NOT dead
        hsv = cv2.cvtColor(bar_check_roi, cv2.COLOR_BGR2HSV)
        for i, (lower, upper) in enumerate(alive_color_ranges):
            mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
            if cv2.countNonZero(mask) > (bar_check_roi.shape[0] * bar_check_roi.shape[1] * 0.05):
                return False

        # 2. OCR for "x0"
        text_roi = roi[:, int(w_roi*0.75):]
        
        gray = cv2.cvtColor(text_roi, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)
        
        # Filter out noise: if too many pixels are white, it's probably not text on dark background
        white_pixels = cv2.countNonZero(thresh)
        total_pixels = thresh.shape[0] * thresh.shape[1]
        
        if white_pixels > total_pixels * 0.4 or white_pixels < 5:
            return False
            
        kernel = np.ones((2, 2), np.uint8)
        thresh = cv2.dilate(thresh, kernel, iterations=1)
        
        text = pytesseract.image_to_string(thresh, config="--oem 3 --psm 7 -c tessedit_char_whitelist=xXoO0123456789").strip().lower()
        
        matched = False
        # Very strict matching: requires an 'x' AND a '0' or 'o'
        if 2 <= len(text) <= 5:
            if ("x" in text) and ("0" in text or "o" in text):
                matched = True
            elif text in ["x.0", "x.o", "x:0", "x:o", "xo", "x0"]:
                matched = True
        
        return matched


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
