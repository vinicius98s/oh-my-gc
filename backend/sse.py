import queue
import threading


class SSEBroadcaster:
    def __init__(self):
        self.listeners = []
        self.lock = threading.Lock()

    def register(self):
        q = queue.Queue(maxsize=5)
        with self.lock:
            self.listeners.append(q)
        return q

    def unregister(self, q):
        with self.lock:
            self.listeners.remove(q)

    def broadcast(self, event, data):
        message = f"event: {event}\ndata: {data}\n\n"
        with self.lock:
            for q in self.listeners:
                try:
                    with q.mutex:
                        q.queue.clear()
                    q.put_nowait(message)
                except queue.Full:
                    pass
