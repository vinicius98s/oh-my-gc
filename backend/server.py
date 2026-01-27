import http.server
import json
import sqlite3
import urllib.parse
from utils import parse_args
from database import (
    get_dungeons,
    get_dungeons_entries,
    get_characters,
    get_tracked_characters,
    update_tracked_characters,
    update_dungeon_entries,
    get_statistics,
    get_recommendation,
    get_recommendation,
    get_inventory,
    update_inventory_item,
    get_items,
    grant_inventory_item
)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, broadcaster=None, **kwargs):
        self.broadcaster = broadcaster
        super().__init__(*args, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
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
            with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
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
                with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
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

        elif self.path == "/inventory":
            try:
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()

                args = parse_args()
                with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
                    content_len = int(self.headers.get("Content-Length"))
                    payload = json.loads(self.rfile.read(content_len).decode("utf-8"))
                    response = update_inventory_item(DB, payload)
                    if response is None:
                        self.send_error(500, "Server Error")
                    else:
                        self.wfile.write(response.encode())
            except Exception as e:
                self.send_error(500, f"Server Error: {e}")

        elif self.path == "/inventory/add":
            try:
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()

                args = parse_args()
                with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
                    content_len = int(self.headers.get("Content-Length"))
                    payload = json.loads(self.rfile.read(content_len).decode("utf-8"))
                    
                    character_id = payload.get("characterId")
                    item_id = payload.get("itemId")
                    quantity = payload.get("quantity", 1)
                    
                    success = grant_inventory_item(DB, character_id, item_id, quantity)
                    if not success:
                        self.send_error(500, "Server Error")
                    else:
                        self.wfile.write(json.dumps({"data": "ok"}).encode())
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
            with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
                response = get_dungeons(DB)
                if response is None:
                    self.send_error(500, "Server Error")
                else:
                    self.wfile.write(response.encode())

        elif self.path == "/characters":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            args = parse_args()
            with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
                response = get_characters(DB)
                if response is None:
                    self.send_error(500, "Server Error")
                else:
                    self.wfile.write(response.encode())

        elif self.path.startswith("/dungeons_entries"):
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            character_id = params.get("character_id", [None])[0]

            args = parse_args()
            with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
                response = get_dungeons_entries(DB, character_id)
                if response is None:
                    self.send_error(500, "Server Error")
                else:
                    self.wfile.write(response.encode())

        elif self.path == "/statistics":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            args = parse_args()
            with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
                response = get_statistics(DB)
                if response is None:
                    self.send_error(500, "Server Error")
                else:
                    self.wfile.write(response.encode())

        elif self.path == "/tracked_characters":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            args = parse_args()
            with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
                response = get_tracked_characters(DB)
                if response is None:
                    self.send_error(500, "Server Error")
                else:
                    self.wfile.write(response.encode())

        elif self.path.startswith("/recommend"):
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            character_id = params.get("character_id", [None])[0]
            dungeon_id = params.get("dungeon_id", [None])[0]

            args = parse_args()
            with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
                actual_dungeon_id = None
                if dungeon_id:
                    try:
                        actual_dungeon_id = int(dungeon_id)
                    except ValueError:
                        cursor = DB.cursor()
                        row = cursor.execute("SELECT id FROM dungeons WHERE name = ?", (dungeon_id,)).fetchone()
                        if row:
                            actual_dungeon_id = row[0]

                response = get_recommendation(DB, character_id, actual_dungeon_id)
                if response is None:
                    self.send_error(500, "Server Error")
                else:
                    self.wfile.write(response.encode())

        elif self.path.startswith("/inventory"):
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            args = parse_args()
            with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
                response = get_inventory(DB)
                if response is None:
                    self.send_error(500, "Server Error")
                else:
                    self.wfile.write(response.encode())

        elif self.path == "/items":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            args = parse_args()
            with sqlite3.connect(f"{args.user_data}/oh-my-gc.sqlite3") as DB:
                response = get_items(DB)
                if response is None:
                    self.send_error(500, "Server Error")
                else:
                    self.wfile.write(response.encode())

        else:
            self.send_error(404, "Not Found")
