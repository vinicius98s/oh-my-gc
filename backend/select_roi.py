import cv2
import game
import os
import sqlite3
from utils import parse_args

def main():
    args = parse_args()
    
    print("Looking for GrandChase window...")
    window = game.get_window()
    if window is None:
        print("Game window not found!")
        return

    # Create user_data directory if it doesn't exist for the screenshot
    if not os.path.exists(args.user_data):
        os.makedirs(args.user_data)
        
    screenshot_path = os.path.join(args.user_data, "select_roi_temp.png")
    print(f"Capturing screenshot to {screenshot_path}...")
    
    # take_screenshot takes (window, path)
    img = game.take_screenshot(window, screenshot_path)
    
    if img is None:
        print("Failed to capture screenshot!")
        return

    print("\n--- ROI Selector Instructions ---")
    print("1. A window will open with the game screenshot.")
    print("2. Click and drag to draw a rectangle over the red text area.")
    print("3. Press ENTER or SPACE to confirm the selection.")
    print("4. Press 'c' or ESC to cancel.")
    print("----------------------------------\n")

    # selectROI returns (x, y, w, h)
    roi = cv2.selectROI("Select ROI", img, fromCenter=False, showCrosshair=True)
    
    if roi[2] > 0 and roi[3] > 0:
        x, y, w, h = roi
        print(f"\nCaptured ROI: (x={x}, y={y}, w={w}, h={h})")
        print(f"Copy this to your code: x, y, w, h = ({x}, {y}, {w}, {h})")
    else:
        print("\nSelection cancelled.")

    cv2.destroyAllWindows()
    if os.path.exists(screenshot_path):
        os.remove(screenshot_path)

if __name__ == "__main__":
    main()
