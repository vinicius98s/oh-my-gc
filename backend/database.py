import json


def get_dungeons(DB):
    try:
        cursor = DB.cursor()
        rows = cursor.execute("SELECT * FROM dungeons").fetchall()
        response = []
        for row in rows:
            response.append({
                "id": row[0],
                "name": row[1],
                "display_name": row[2],
                "type": row[3],
                "weekly_entry_limit": row[4],
                "daily_entry_limit": row[5],
                "accent_color": row[6],
            })
        return json.dumps({"data": response})
    except Exception as e:
        print(e)
        return None


def get_dungeons_entries(DB):
    try:
        cursor = DB.cursor()
        
        # Get raw entries for the current week
        entries_query = """
            SELECT * FROM dungeons_entries
            WHERE started_at >= date('now', 'weekday 3', '-7 days')
            AND started_at < date('now', 'weekday 3', '+7 days')
            AND finished_at IS NOT NULL
        """
        rows = cursor.execute(entries_query).fetchall()
        entries = [{
            "id": row[0],
            "dungeon_id": row[1],
            "character_id": row[2],
            "started_at": row[3],
            "finished_at": row[4]
        } for row in rows]
        
        # Get weekly entry counts per character per dungeon
        count_query = """
            SELECT de.dungeon_id, c.id AS character_id, COUNT(de.id) as entries_count
            FROM characters c
            LEFT JOIN dungeons_entries de ON c.id = de.character_id
            AND de.started_at >= date('now', 'weekday 3', '-7 days')
            AND de.started_at < date('now', 'weekday 3', '+7 days')
            AND de.finished_at IS NOT NULL
            WHERE c.tracking = TRUE
            GROUP BY de.dungeon_id, c.id
        """
        count_rows = cursor.execute(count_query).fetchall()
        characters_entries = [{
            "dungeon_id": row[0],
            "character_id": row[1],
            "entries_count": row[2]
        } for row in count_rows if row[0] is not None]
        
        # Get average completion time per character per dungeon
        avg_time_query = """
            SELECT de.dungeon_id, c.id AS character_id, AVG(
                (julianday(de.finished_at) - julianday(de.started_at)) * 86400
            ) as avg_time
            FROM characters c
            LEFT JOIN dungeons_entries de ON c.id = de.character_id
            AND de.finished_at IS NOT NULL
            AND de.finished_at != de.started_at
            WHERE c.tracking = TRUE
            GROUP BY de.dungeon_id, c.id
        """
        avg_time_rows = cursor.execute(avg_time_query).fetchall()
        characters_avg_completion_time = [{
            "dungeon_id": row[0],
            "character_id": row[1],
            "avg_time": row[2]
        } for row in avg_time_rows if row[0] is not None]
        
        return json.dumps({
            "data": {
                "entries": entries,
                "characters_entries": characters_entries,
                "characters_avg_completion_time": characters_avg_completion_time
            }
        })
    except Exception as e:
        print(e)
        return None



def get_tracked_characters(DB):
    try:
        cursor = DB.cursor()
        query = "SELECT id, name FROM characters WHERE tracking = 1"
        rows = cursor.execute(query).fetchall()

        # Fetch all schedules
        schedules_query = "SELECT character_id, day, dungeon_id FROM character_schedules"
        schedules_rows = cursor.execute(schedules_query).fetchall()

        # Build schedules map: character_id -> day -> [dungeons]
        schedules_map = {}
        for char_id, day, dungeon_id in schedules_rows:
            if char_id not in schedules_map:
                schedules_map[char_id] = {}
            if day not in schedules_map[char_id]:
                schedules_map[char_id][day] = []
            schedules_map[char_id][day].append(dungeon_id)

        response = []
        for row in rows:
            char_id = row[0]
            response.append({
                "id": char_id,
                "name": row[1],
                "schedule": schedules_map.get(char_id, {})
            })

        return json.dumps({"data": response})
    except Exception:
        return None


def update_tracked_characters(DB, payload):
    response = []
    characters = payload.get("characters", [])
    schedules = payload.get("schedules", {})

    if characters:
        cursor = DB.cursor()
        
        # 1. Update characters tracking status
        placeholders = ", ".join(["?"] * len(characters))
        q = f"UPDATE characters SET tracking = 1 WHERE id IN ({placeholders}) RETURNING id, name"
        rows = cursor.execute(q, characters).fetchall()
        response = [{"id": row[0], "name": row[1]} for row in rows]

        # 2. Update Schedules
        # First, delete existing schedules for these characters to avoid duplicates/stale data
        delete_q = f"DELETE FROM character_schedules WHERE character_id IN ({placeholders})"
        cursor.execute(delete_q, characters)

        # Prepare insert data
        insert_data = []
        for char_id_str, daily_schedules in schedules.items():
            # JSON keys are strings, ensure we use int for DB if needed (though python handles it)
            char_id = int(char_id_str)
            if char_id not in characters:
                continue # Only save schedules for tracked characters

            for day, dungeon_ids in daily_schedules.items():
                for dungeon_id in dungeon_ids:
                    insert_data.append((char_id, day, dungeon_id))
        
        if insert_data:
            insert_q = "INSERT INTO character_schedules (character_id, day, dungeon_id) VALUES (?, ?, ?)"
            cursor.executemany(insert_q, insert_data)

        DB.commit()
    return json.dumps({"data": response})


def update_dungeon_entries(DB, dungeon_id, character_id, value, update_mode="weekly"):
    try:
        cursor = DB.cursor()
        delete_query = "DELETE FROM dungeons_entries WHERE finished_at IS NULL AND character_id = ? AND dungeon_id = ?"
        cursor.execute(delete_query, (character_id, dungeon_id))
 
        date_filter = ""
        if update_mode == "daily":
            # Filter for today only
            date_filter = """
                AND started_at >= date('now')
                AND started_at < date('now', '+1 day')
            """
        else:
            # Default weekly behavior (last 7 days)
            date_filter = """
                AND started_at >= date('now', 'weekday 3', '-7 days')
                AND started_at < date('now', 'weekday 3', '+7 days')
            """

        query = f"""
            SELECT count(id) FROM dungeons_entries
            WHERE dungeon_id = ?
            AND character_id = ?
            {date_filter}
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
            q = f"""
                SELECT id FROM dungeons_entries
                WHERE dungeon_id = ?
                AND character_id = ?
                {date_filter}
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
