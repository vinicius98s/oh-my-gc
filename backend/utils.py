import argparse


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data",
        type=str,
        default="./data"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=5000
    )
    parser.add_argument(
        "--TESSERACT_PATH",
        type=str,
        default="./third-party/tesseract-win64/tesseract.exe"
    )
    args, _ = parser.parse_known_args()
    return args
