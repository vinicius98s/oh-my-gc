from os import walk
from rapidfuzz import fuzz
import pytesseract
import pywinctl as pwc
import numpy as np
import cv2
import mss

# TODO: figure this out when app is bundled
pytesseract.pytesseract.tesseract_cmd = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'

class GameState:
    def __init__(self, character, img, DB):
        self.img = img
        self.character = character
        self.dungeon = None
        self.is_playing = False
        self.DB = DB

    def __str__(self):
        return f"GameState(\n\tcharacter={self.character}, \n\tdungeon={self.dungeon}, \n\tis_playing={self.is_playing}\n)"

    def match_completed_dungeon(self, entry_id):
        if self.match_lobby_character():
            self.is_playing = False
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

            match = fuzz.partial_ratio(text, "COMPLETE")
            if (
                text.startswith("COMP") or
                text.endswith("LETE") or
                match >= 80
            ):
                cursor = self.DB.cursor()
                cursor.execute(
                    "UPDATE dungeons_entries SET finished_at = CURRENT_TIMESTAMP, character_id = ? WHERE id = ?",
                    (self.character, entry_id))
                self.DB.commit()
                self.is_playing = False
                return True

    def match_playing_character(self):
        templates = []

        templates_path = "C:\\Users\\vinic\\oh-my-gc\\backend\\data\\templates\\characters\\in-game"
        for (dirpath, dirnames, filenames) in walk(templates_path):
            for filename in filenames:
                character_name = filename.replace(".png", "")
                templates.append(
                    (character_name, cv2.imread(f"{templates_path}/{filename}")))

        x, y, w, h = (65, 10, 180, 150)
        roi = self.img[y:y+h, x:x+w]

        character_match = (0, "")

        for (character_name, template) in templates:
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
            self.character = character_id
            self.is_playing = True
            return character_id

    def match_loading_dungeon(self, character_id):
        if self.match_playing_character() is None:
            templates = []

            templates_path = "C:\\Users\\vinic\\oh-my-gc\\backend\\data\\templates\\dungeons"
            for (dirpath, dirnames, filenames) in walk(templates_path):
                for filename in filenames:
                    character_name = filename.replace(".png", "")
                    templates.append(
                        (character_name, cv2.imread(
                            f"{templates_path}/{filename}", cv2.IMREAD_GRAYSCALE))
                    )

            x, y, w, h = (500, 100, 980, 670)
            roi = cv2.cvtColor(self.img[y:y + h, x:x + w], cv2.COLOR_BGR2GRAY)

            best_match = (0, "")
            second_best_match = (0, "")

            for (dungeon_name, template) in templates:
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

                self.dungeon = dungeon
                self.is_playing = True
                return entry_id

    def match_lobby_character(self):
        templates = []

        templates_path = "C:\\Users\\vinic\\oh-my-gc\\backend\\data\\templates\\characters"
        for (dirpath, dirnames, filenames) in walk(templates_path):
            for filename in filenames:
                character_name = filename.replace(".png", "")
                templates.append(
                    (character_name, cv2.imread(f"{templates_path}/{filename}")))

        x, y, w, h = (18, 1020, 75, 55)
        roi = self.img[y:y+h, x:x+w]

        character_match = (0, "")

        for (character_name, template) in templates:
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
            self.character = character_id
            self.is_playing = False
            self.dungeon = None


def get_window(title):
    try:
        windows = pwc.getWindowsWithTitle(title)
        if len(windows) == 0:
            return
        return windows[0]
    except Exception as e:
        print('\n[get_window]:', e)
        return


def take_screenshot(window, image_path):
    with mss.mss() as sct:
        screenshot = sct.grab({
            "top": window.top,
            "left": window.left,
            "width": window.width,
            "height": window.height
        })
        mss.tools.to_png(screenshot.rgb, screenshot.size, output=image_path)

    img = cv2.imread(image_path)
    return img
