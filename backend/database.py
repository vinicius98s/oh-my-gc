import json


def get_dungeons(DB):
    try:
        cursor = DB.cursor()
        rows = cursor.execute("SELECT * FROM dungeons").fetchall()
        response = []
        count_query = """
            SELECT COUNT(de.id), c.id AS character_id FROM characters c
            LEFT JOIN dungeons_entries de ON c.id = de.character_id
            AND de.dungeon_id = ?
            AND de.started_at >= date('now', 'weekday 3', '-7 days')
            AND de.started_at < date('now', 'weekday 3', '+7 days')
            WHERE c.tracking = TRUE GROUP BY c.id
        """
        for row in rows:
            id = row[0]
            entries_rows = cursor.execute(count_query, (id,)).fetchall()
            characters_entries = [{
                "entries_count": entry_row[0],
                "character_id": entry_row[1],
            } for entry_row in entries_rows]
            response.append({
                "id": id,
                "name": row[1],
                "weekly_entry_limit": row[2],
                "characters_entries": characters_entries
            })
        return json.dumps({"data": response})
    except Exception as e:
        print(e)
        return None


def get_dungeons_entries(DB):
    try:
        cursor = DB.cursor()
        query = """
            SELECT * FROM dungeons_entries
            WHERE started_at >= date('now', 'weekday 3', '-7 days')
            AND started_at < date('now', 'weekday 3', '+7 days')
        """
        rows = cursor.execute(query).fetchall()
        response = [{
            "id": row[0],
            "dungeon_id": row[1],
            "character_id": row[2],
            "started_at": row[3],
            "finished_at": row[4]
        } for row in rows]
        return json.dumps({"data": response})
    except Exception:
        return None


def get_tracked_characters(DB):
    try:
        cursor = DB.cursor()
        query = "SELECT id, name FROM characters WHERE tracking = 1"
        rows = cursor.execute(query).fetchall()
        response = [{"id": row[0], "name": row[1]} for row in rows]
        return json.dumps({"data": response})
    except Exception:
        return None


def update_tracked_characters(DB, characters):
    response = []
    if characters:
        cursor = DB.cursor()
        placeholders = ", ".join(["?"] * len(characters))
        q = f"UPDATE characters SET tracking = 1 WHERE id IN ({
            placeholders}) RETURNING id, name"
        rows = cursor.execute(q, characters).fetchall()
        response = [{"id": row[0], "name": row[1]} for row in rows]
        DB.commit()
    return json.dumps({"data": response})


def update_dungeon_entries(DB, dungeon_id, character_id, value):
    try:
        cursor = DB.cursor()
        query = """
            SELECT count(id) FROM dungeons_entries
            WHERE dungeon_id = ?
            AND character_id = ?
            AND started_at >= date('now', 'weekday 3', '-7 days')
            AND started_at < date('now', 'weekday 3', '+7 days')
        """
        count = cursor.execute(query, (dungeon_id, character_id)).fetchone()[0]

        if value > count:
            diff = value - count
            insert = """
                INSERT INTO dungeons_entries
                (dungeon_id, character_id, started_at, finished_at)
                VALUES
                (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """
            params = [(dungeon_id, character_id)
                      for _ in range(diff)]
            cursor.executemany(insert, params)
        else:
            diff = count - value
            q = """
                SELECT id FROM dungeons_entries
                WHERE dungeon_id = ?
                AND character_id = ?
                AND started_at >= date('now', 'weekday 3', '-7 days')
                AND started_at < date('now', 'weekday 3', '+7 days')
            """
            ids = cursor.execute(q, (dungeon_id, character_id)).fetchall()
            formatted_ids = [id[0] for id in ids][:diff]
            if formatted_ids:
                placeholders = ','.join(['?'] * len(formatted_ids))
                cursor.execute(
                    f"DELETE FROM dungeons_entries WHERE id IN ({
                        placeholders})",
                    formatted_ids
                )

        DB.commit()
        return json.dumps({"data": "ok"})
    except Exception:
        return None
