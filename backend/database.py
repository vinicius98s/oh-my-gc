import json
import datetime


def get_date_filter_sql(entry_period, reset_day):
    # Shift time by -6 hours to determing "logic day" (for 06:00 UTC reset)
    # Then start period at +6 hours (06:00 UTC)
    if entry_period == "daily":
        return """
            AND started_at >= datetime(date('now', '-6 hours'), '+6 hours')
            AND started_at < datetime(date('now', '-6 hours'), '+1 day', '+6 hours')
        """
    elif entry_period == "weekly":
        return f"""
            AND started_at >= datetime(date('now', '-6 hours', '-6 days', 'weekday {reset_day}'), '+6 hours')
            AND started_at < datetime(date('now', '-6 hours', '+1 day', 'weekday {reset_day}'), '+6 hours')
        """
    return ""


def get_dungeon_stats(cursor, dungeon_id, character_id, entry_period, reset_day):
    date_filter = get_date_filter_sql(entry_period, reset_day)
    
    count_query = f"""
        SELECT COUNT(id) FROM dungeons_entries 
        WHERE dungeon_id = ? AND character_id = ? 
        AND finished_at IS NOT NULL
        {date_filter}
    """
    count = cursor.execute(count_query, (dungeon_id, character_id)).fetchone()[0]

    avg_time_query = """
        SELECT AVG((julianday(finished_at) - julianday(started_at)) * 86400)
        FROM dungeons_entries
        WHERE dungeon_id = ?
        AND finished_at IS NOT NULL
        AND finished_at != started_at
    """
    avg_time = cursor.execute(avg_time_query, (dungeon_id,)).fetchone()[0]
    
    return count, avg_time


def get_single_dungeon_entry_stats(DB, character_id, dungeon_id):
    try:
        cursor = DB.cursor()
        dungeon_query = "SELECT entry_period, reset_day FROM dungeons WHERE id = ?"
        dungeon = cursor.execute(dungeon_query, (dungeon_id,)).fetchone()
        
        if not dungeon:
            return None
            
        entry_period, reset_day = dungeon
        count, avg_time = get_dungeon_stats(cursor, dungeon_id, character_id, entry_period, reset_day)
        
        return {
            "dungeonId": dungeon_id,
            "entriesCount": count,
            "avgTime": avg_time
        }
    except Exception as e:
        print(f"Error in get_single_dungeon_entry_stats: {e}")
        return None


def get_dungeons(DB):
    try:
        cursor = DB.cursor()
        rows = cursor.execute("SELECT * FROM dungeons").fetchall()
        response = []
        for row in rows:
            response.append({
                "id": row[0],
                "name": row[1],
                "displayName": row[2],
                "type": row[3],
                "entryLimit": row[4],
                "entryPeriod": row[5],
                "resetDay": row[6],
                "accentColor": row[7],
            })
        return json.dumps({"data": response})
    except Exception as e:
        print(e)
        return None


def get_dungeons_entries(DB, character_id):
    try:
        cursor = DB.cursor()
        dungeons = cursor.execute("SELECT id, entry_period, reset_day FROM dungeons").fetchall()
        entries_data = []

        if character_id is not None:
            for d_id, entry_period, reset_day in dungeons:
                count, avg_time = get_dungeon_stats(cursor, d_id, character_id, entry_period, reset_day)
                entries_data.append({
                    "dungeonId": d_id,
                    "characterId": int(character_id),
                    "entriesCount": count,
                    "avgTime": avg_time
                })
        else:
            chars = cursor.execute("SELECT id FROM characters WHERE tracking = 1").fetchall()
            for char_row in chars:
                char_id = char_row[0]
                for d_id, entry_period, reset_day in dungeons:
                    count, avg_time = get_dungeon_stats(cursor, d_id, char_id, entry_period, reset_day)
                    entries_data.append({
                        "dungeonId": d_id,
                        "characterId": char_id,
                        "entriesCount": count,
                        "avgTime": avg_time
                    })

        return json.dumps({
            "data": entries_data
        })
    except Exception as e:
        print(f"Error in get_dungeons_entries: {e}")
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


def update_dungeon_entries(DB, dungeon_id, character_id, value):
    try:
        cursor = DB.cursor()
        
        # Get dungeon's limit period and reset day
        dungeon_query = "SELECT entry_period, reset_day FROM dungeons WHERE id = ?"
        dungeon = cursor.execute(dungeon_query, (dungeon_id,)).fetchone()
        if not dungeon:
            return None
        
        entry_period, reset_day = dungeon
        
        delete_query = "DELETE FROM dungeons_entries WHERE finished_at IS NULL AND character_id = ? AND dungeon_id = ?"
        cursor.execute(delete_query, (character_id, dungeon_id))
 
        date_filter = get_date_filter_sql(entry_period, reset_day)

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


def get_statistics(DB):
    try:
        cursor = DB.cursor()
        
        # 1. Total runs
        total_runs_query = "SELECT COUNT(*) FROM dungeons_entries WHERE finished_at IS NOT NULL"
        total_runs = cursor.execute(total_runs_query).fetchone()[0]
        
        # 2. Total time spent (seconds)
        total_time_query = """
            SELECT SUM((julianday(finished_at) - julianday(started_at)) * 86400)
            FROM dungeons_entries
            WHERE finished_at IS NOT NULL AND finished_at != started_at
        """
        total_time_spent = cursor.execute(total_time_query).fetchone()[0] or 0
        
        # 3. Most played dungeon
        most_played_dungeon_query = """
            SELECT dungeon_id, COUNT(*) as count
            FROM dungeons_entries
            WHERE finished_at IS NOT NULL
            GROUP BY dungeon_id
            ORDER BY count DESC
            LIMIT 1
        """
        most_played_dungeon_row = cursor.execute(most_played_dungeon_query).fetchone()
        most_played_dungeon = {
            "id": most_played_dungeon_row[0],
            "count": most_played_dungeon_row[1]
        } if most_played_dungeon_row else None
        
        # 4. Most played character
        most_played_character_query = """
            SELECT character_id, COUNT(*) as count
            FROM dungeons_entries
            WHERE finished_at IS NOT NULL
            GROUP BY character_id
            ORDER BY count DESC
            LIMIT 1
        """
        most_played_character_row = cursor.execute(most_played_character_query).fetchone()
        most_played_character = {
            "id": most_played_character_row[0],
            "count": most_played_character_row[1]
        } if most_played_character_row else None

        # 5. Global average clear time
        avg_clear_time_query = """
            SELECT AVG((julianday(finished_at) - julianday(started_at)) * 86400)
            FROM dungeons_entries
            WHERE finished_at IS NOT NULL AND finished_at != started_at
        """
        avg_clear_time = cursor.execute(avg_clear_time_query).fetchone()[0] or 0

        return json.dumps({
            "data": {
                "totalRuns": total_runs,
                "totalTimeSpent": total_time_spent,
                "mostPlayedDungeon": most_played_dungeon,
                "mostPlayedCharacter": most_played_character,
                "avgClearTime": avg_clear_time
            }
        })
    except Exception as e:
        print(f"Error getting statistics: {e}")
        return None

def get_recommendation(DB, current_character_id, current_dungeon_id):
    try:
        cursor = DB.cursor()
 
        if current_character_id is not None:
            current_character_id = int(current_character_id)
        
        now_shifted = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=6)
        today = now_shifted.strftime("%A")
 
        characters = cursor.execute("SELECT id, name FROM characters WHERE tracking = 1 AND id != ?", (current_character_id,)).fetchall()
        
        dungeons_rows = cursor.execute("SELECT id, entry_limit, entry_period, reset_day FROM dungeons").fetchall()
        dungeons_map = {row[0]: {"limit": row[1], "period": row[2], "reset_day": row[3]} for row in dungeons_rows}

        if current_dungeon_id is not None:
            current_dungeon_id = int(current_dungeon_id)
            
            for char_id, char_name in characters:
                schedule = cursor.execute(
                    "SELECT dungeon_id FROM character_schedules WHERE character_id = ? AND day = ?",
                    (char_id, today)
                ).fetchall()
                
                if not schedule:
                    continue
                    
                dungeon_ids = [row[0] for row in schedule]
                
                if current_dungeon_id not in dungeon_ids:
                    continue
                
                d_info = dungeons_map.get(current_dungeon_id)
                if not d_info or d_info["limit"] is None:
                    continue
                
                date_filter = get_date_filter_sql(d_info["period"], d_info["reset_day"])
                count = cursor.execute(f"SELECT COUNT(id) FROM dungeons_entries WHERE dungeon_id = ? AND character_id = ? AND finished_at IS NOT NULL {date_filter}", (current_dungeon_id, char_id)).fetchone()[0]
                
                if count < d_info["limit"]:
                    return json.dumps({"data": {"id": char_id, "name": char_name}})

        for char_id, char_name in characters:
            schedule = cursor.execute(
                "SELECT dungeon_id FROM character_schedules WHERE character_id = ? AND day = ?",
                (char_id, today)
            ).fetchall()
            
            if not schedule:
                continue
                
            dungeon_ids = [row[0] for row in schedule]
            
            for d_id in dungeon_ids:
                d_info = dungeons_map.get(d_id)
                if not d_info or d_info["limit"] is None:
                    continue
                
                date_filter = get_date_filter_sql(d_info["period"], d_info["reset_day"])
                count = cursor.execute(f"SELECT COUNT(id) FROM dungeons_entries WHERE dungeon_id = ? AND character_id = ? AND finished_at IS NOT NULL {date_filter}", (d_id, char_id)).fetchone()[0]
                
                if count < d_info["limit"]:
                    return json.dumps({"data": {"id": char_id, "name": char_name}})
 
        return json.dumps({"data": None})
    except Exception as e:
        print(f"Error in get_recommendation: {e}")
        return None
