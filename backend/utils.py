import argparse


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--user-data", type=str, default="./data", help="Directory where persistent user data (DB, logs) is located")
    parser.add_argument("--templates", type=str, default="./templates", help="Directory where read-only templates are located")
    parser.add_argument("--migrations", type=str, default="./migrations", help="Directory where migration files are located")
    parser.add_argument("--TESSERACT_PATH", type=str, default="./third-party/tesseract-win64/tesseract.exe", help="Path to tesseract executable")
    parser.add_argument("--port", type=int, default=5000, help="Port to run the backend server on")
    args, _ = parser.parse_known_args()
    return args
