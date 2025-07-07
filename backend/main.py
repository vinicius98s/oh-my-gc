import argparse
import time
import threading
import json
import sqlite3
import socketserver
import http.server

from game import GameState
import game
from sse import SSEBroadcaster


shutdown_event = threading.Event()
broadcaster = SSEBroadcaster()


def game_loop():
    dungeon_entry_id = None
    last_character_id = None
    args = parse_args()
    print("[game_loop]: Starting game loop...")

    while not shutdown_event.is_set():
        if shutdown_event.wait(timeout=0.5):
            break

        with sqlite3.connect(f"{args.data}/oh-my-gc.sqlite3") as DB:
            title = "GrandChase v.1.71.23 x64"
            window = game.get_window(title)
            if window is None:
                print("[game_loop]: Game window not found")
                continue

            img = game.take_screenshot(window, f"{args.data}/screenshot.png")
            game_state = GameState(last_character_id, img, DB)
            game_state.match_lobby_character()
            if game_state.character is not None:
                last_character_id = game_state.character

            if not game_state.is_playing:
                entry_id = game_state.match_loading_dungeon(last_character_id)
                if entry_id:
                    dungeon_entry_id = entry_id

            if game_state.is_playing:
                game_state.match_playing_character()
                completed = game_state.match_completed_dungeon(dungeon_entry_id)
                if completed:
                    broadcaster.broadcast(
                        event="dungeon_completed",
                        data={"character_id": game_state.character, "dungeon_entry_id": dungeon_entry_id}
                    )

            broadcaster.broadcast(
                event="character",
                data=game_state.character
            )

    print("[game_loop]: Game loop has shut down")


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


class Handler(http.server.SimpleHTTPRequestHandler):
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
                cursor = DB.cursor()
                content_len = int(self.headers.get("Content-Length"))
                body = self.rfile.read(content_len).decode("utf-8")
                characters = json.loads(body)["characters"]
                response = []
                if characters:
                    placeholders = ", ".join(["?"] * len(characters))
                    q = f"UPDATE characters SET tracking = 1 WHERE id IN ({
                        placeholders}) RETURNING id, name"
                    rows = cursor.execute(q, characters).fetchall()
                    response = [{"id": row[0], "name": row[1]} for row in rows]
                    DB.commit()

                self.wfile.write(json.dumps({"data": response}).encode())

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

                    cursor = DB.cursor()
                    count = cursor.execute(
                        "SELECT count(id) FROM dungeons_entries WHERE dungeon_id = ? AND character_id = ?",
                        (dungeon_id, character_id)).fetchone()[0]

                    if value > count:
                        diff = value - count
                        q = "INSERT INTO dungeons_entries (dungeon_id, character_id, started_at, finished_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
                        params = [(dungeon_id, character_id)
                                  for _ in range(diff)]
                        cursor.executemany(q, params)
                    else:
                        diff = count - value
                        ids = cursor.execute(
                            "SELECT id FROM dungeons_entries WHERE dungeon_id = ? AND character_id = ?",
                            (dungeon_id, character_id)
                        ).fetchall()

                        formatted_ids = [id[0] for id in ids][:diff]
                        if formatted_ids:
                            placeholders = ','.join(['?'] * len(formatted_ids))
                            cursor.execute(
                                f"DELETE FROM dungeons_entries WHERE id IN ({
                                    placeholders})",
                                formatted_ids
                            )

                    DB.commit()
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

            q = broadcaster.register()
            try:
                while True:
                    message = q.get()
                    self.wfile.write(message.encode("utf-8"))
                    self.wfile.flush()
            except BrokenPipeError:
                print("[server]: Client disconnected")
            finally:
                broadcaster.unregister(q)

        elif self.path == "/dungeons":
            try:
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()

                args = parse_args()
                with sqlite3.connect(f"{args.data}/oh-my-gc.sqlite3") as DB:
                    cursor = DB.cursor()
                    rows = cursor.execute("SELECT * FROM dungeons").fetchall()
                    response = [{
                        "id": row[0],
                        "name": row[1],
                        "weekly_entry_limit": row[2]
                    } for row in rows]
                    self.wfile.write(json.dumps({"data": response}).encode())
            except Exception as e:
                self.send_error(500, f"Server Error: {e}")

        elif self.path == "/dungeons_entries":
            try:
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()

                args = parse_args()
                with sqlite3.connect(f"{args.data}/oh-my-gc.sqlite3") as DB:
                    cursor = DB.cursor()
                    rows = cursor.execute(
                        "SELECT * FROM dungeons_entries").fetchall()
                    response = [{
                        "id": row[0],
                        "dungeon_id": row[1],
                        "character_id": row[2],
                        "started_at": row[3],
                        "finished_at": row[4]
                    } for row in rows]
                    self.wfile.write(json.dumps({"data": response}).encode())
            except Exception as e:
                self.send_error(500, f"Server Error: {e}")

        elif self.path == "/tracked_characters":
            try:
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()

                args = parse_args()
                with sqlite3.connect(f"{args.data}/oh-my-gc.sqlite3") as DB:
                    cursor = DB.cursor()
                    q = "SELECT id, name FROM characters WHERE tracking = 1"
                    rows = cursor.execute(q).fetchall()
                    response = [{"id": row[0], "name": row[1]} for row in rows]
                    self.wfile.write(json.dumps({"data": response}).encode())

            except Exception as e:
                self.send_error(500, f"Server Error: {e}")

        else:
            self.send_error(404, "Not Found")


def server(httpd):
    httpd.serve_forever()
    print("[server]: Server has shut down")


def main():
    args = parse_args()
    httpd = socketserver.ThreadingTCPServer(("", args.port), Handler)
    print(f"[main]: Serving at http://localhost:{args.port}")

    run_server = threading.Thread(target=server, args=(httpd,))
    run_game_loop = threading.Thread(target=game_loop, daemon=True)

    run_server.start()
    run_game_loop.start()

    try:
        while run_server.is_alive() and run_game_loop.is_alive():
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n[main]: Exiting...")
    finally:
        shutdown_event.set()
        httpd.shutdown()

        run_server.join()
        run_game_loop.join()


if __name__ == "__main__":
    main()
