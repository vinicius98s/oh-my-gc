import http.server
import json
import sqlite3
from utils import parse_args
from database import (
    get_dungeons,
    get_dungeons_entries,
    get_tracked_characters,
    update_tracked_characters,
    update_dungeon_entries
)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, broadcaster=None, **kwargs):
        self.broadcaster = broadcaster
        super().__init__(*args, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path == "/tracked_characters":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            args = parse_args()
            with sqlite3.connect(f"{args.data}/oh-my-gc.sqlite3") as DB:
                content_len = int(self.headers.get("Content-Length"))
            body = self.rfile.read(content_len).decode("utf-8")
            payload = json.loads(body)
            response = update_tracked_characters(DB, payload)
            self.wfile.write(response.encode())

        elif self.path == "/dungeons_entries":
            try:
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()

                args = parse_args()
                with sqlite3.connect(f"{args.data}/oh-my-gc.sqlite3") as DB:
                    content_len = int(self.headers.get("Content-Length"))
                    body = json.loads(self.rfile.read(
                        content_len).decode("utf-8"))
                    dungeon_id = body["dungeonId"]
                    character_id = body["characterId"]
                    value = body["value"]

                    response = update_dungeon_entries(
                        DB, dungeon_id, character_id, value)
                    if response is None:
                        self.send_error(500, "Server Error")
                    else:
                        self.wfile.write(response.encode())
            except Exception as e:
                self.send_error(500, f"Server Error: {e}")

        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        if self.path == "/events":
            self.send_response(200)
            self.send_header("Content-type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()

            q = self.broadcaster.register()
            try:
                while True:
                    message = q.get()
                    self.wfile.write(message.encode("utf-8"))
                    self.wfile.flush()
            except BrokenPipeError:
                print("[server]: Client disconnected")
            finally:
                self.broadcaster.unregister(q)

        elif self.path == "/dungeons":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            args = parse_args()
            with sqlite3.connect(f"{args.data}/oh-my-gc.sqlite3") as DB:
                response = get_dungeons(DB)
                if response is None:
                    self.send_error(500, "Server Error")
                else:
                    self.wfile.write(response.encode())

        elif self.path == "/dungeons_entries":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            args = parse_args()
            with sqlite3.connect(f"{args.data}/oh-my-gc.sqlite3") as DB:
                response = get_dungeons_entries(DB)
                if response is None:
                    self.send_error(500, "Server Error")
                else:
                    self.wfile.write(response.encode())

        elif self.path == "/tracked_characters":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            args = parse_args()
            with sqlite3.connect(f"{args.data}/oh-my-gc.sqlite3") as DB:
                response = get_tracked_characters(DB)
                if response is None:
                    self.send_error(500, "Server Error")
                else:
                    self.wfile.write(response.encode())

        else:
            self.send_error(404, "Not Found")
