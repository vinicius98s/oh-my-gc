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
    args, _ = parser.parse_known_args()
    return args
