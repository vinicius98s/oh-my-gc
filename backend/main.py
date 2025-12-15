import time
import threading
import sqlite3
import socketserver
from functools import partial

from game import GameState
import game
from sse import SSEBroadcaster
from utils import parse_args
from server import Handler


shutdown_event = threading.Event()


def game_loop(args, broadcaster):
    dungeon_entry_id = None
    last_character_id = None
    print("[game_loop]: Starting game loop...")

    while not shutdown_event.is_set():
        if shutdown_event.wait(timeout=0.5):
            break

        with sqlite3.connect(f"{args.data}/oh-my-gc.sqlite3") as DB:
            window = game.get_window()
            if window is None:
                print("[game_loop]: Game window not found")
                continue

            img = game.take_screenshot(window, f"{args.data}/screenshot.png")
            game_state = GameState(last_character_id, img, DB, broadcaster)

            game_state.match_lobby_character()
            if game_state.character is not None:
                last_character_id = game_state.character

            entry_id = game_state.match_loading_dungeon(last_character_id)
            if entry_id:
                dungeon_entry_id = entry_id

            game_state.match_playing_character()
            game_state.match_completed_dungeon(dungeon_entry_id)

            broadcaster.broadcast(
                event="character",
                data=game_state.character
            )

    print("[game_loop]: Game loop has shut down")


def server(httpd):
    httpd.serve_forever()
    print("[server]: Server has shut down")


def main():
    args = parse_args()
    broadcaster = SSEBroadcaster()
    handler = partial(Handler, broadcaster=broadcaster)
    httpd = socketserver.ThreadingTCPServer(("", args.port), handler)
    httpd.daemon_threads = True
    print(f"[main]: Serving at http://localhost:{args.port}")

    run_server = threading.Thread(target=server, args=(httpd,))
    run_game_loop = threading.Thread(
        target=game_loop, args=(args, broadcaster), daemon=True)

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
