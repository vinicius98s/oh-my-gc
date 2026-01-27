import json
import datetime


def get_current_day_name(cursor):
    now_query = "SELECT strftime('%w', datetime(date('now', '-6 hours')))"
    current_day_index = int(cursor.execute(now_query).fetchone()[0])
    days_map = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days_map[current_day_index]


def check_all_tasks_done(cursor):
    current_day_name = get_current_day_name(cursor)
    
    # Get all tracked characters
    tracked_chars = cursor.execute("SELECT id FROM characters WHERE tracking = 1").fetchall()
    tracked_ids = [c[0] for c in tracked_chars]
    
    all_done = True
    for char_id_check in tracked_ids:
        schedule_query = """
            SELECT dungeon_id FROM character_schedules 
            WHERE character_id = ? AND day = ?
        """
        schedule_rows = cursor.execute(schedule_query, (char_id_check, current_day_name)).fetchall()
        sch_dungeons = [row[0] for row in schedule_rows]
        
        for d_id in sch_dungeons:
            dungeon_meta_query = "SELECT entry_limit, entry_period, reset_day FROM dungeons WHERE id = ?"
            dungeon_meta = cursor.execute(dungeon_meta_query, (d_id,)).fetchone()
            if not dungeon_meta: continue
            limit, period, r_day = dungeon_meta
            
            c, _ = get_dungeon_stats(cursor, d_id, char_id_check, period, r_day)
            
            completed = False
            if limit and limit > 0:
                if c >= limit: completed = True
            else:
                if c >= 1: completed = True
                
            if not completed:
                all_done = False
                break
        if not all_done:
            break
            
    return all_done


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
        WHERE dungeon_id = ? AND character_id = ?
        AND finished_at IS NOT NULL
        AND finished_at != started_at
    """
    avg_time = cursor.execute(avg_time_query, (dungeon_id, character_id)).fetchone()[0]
    
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



def get_characters(DB):
    try:
        cursor = DB.cursor()
        query = "SELECT id, name, display_name, color_theme FROM characters"
        rows = cursor.execute(query).fetchall()

        response = []
        for row in rows:
            response.append({
                "id": row[0],
                "name": row[1],
                "displayName": row[2],
                "colorTheme": json.loads(row[3]) if row[3] else None
            })

        return json.dumps({"data": response})
    except Exception as e:
        print(f"Error in get_characters: {e}")
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
                "avgClearTime": avg_clear_time,
                "isAllDone": check_all_tasks_done(cursor)
            }
        })
    except Exception as e:
        print(f"Error getting statistics: {e}")
        return None

def get_recommendation(DB, character_id, dungeon_id):
    try:
        cursor = DB.cursor()
        
        # 1. Determine current logic day (0=Sunday to 6=Saturday, consistent with SQLite %w)
        # Shift -6 hours to account for reset time
        # We need to match how `day` is stored in character_schedules.
        # Assuming `day` matches SQLite strftime('%w', ...): 0=Sunday, 1=Monday...
        
        current_day_name = get_current_day_name(cursor)
        
        # 2. Get all tracked characters ordered by ID
        tracked_chars_query = "SELECT id, name FROM characters WHERE tracking = 1 ORDER BY id"
        tracked_chars = cursor.execute(tracked_chars_query).fetchall()
        
        if not tracked_chars:
            return json.dumps({"data": None})
            
        tracked_ids = [c[0] for c in tracked_chars]
        tracked_map = {c[0]: c[1] for c in tracked_chars}
        
        # Determine starting index
        start_index = 0
        if character_id is not None and int(character_id) in tracked_ids:
            start_index = (tracked_ids.index(int(character_id)) + 1) % len(tracked_ids)

        def find_candidate(check_dungeon_id=None):
            # Iterate through characters cyclically
            for i in range(len(tracked_ids)):
                curr_idx = (start_index + i) % len(tracked_ids)
                curr_char_id = tracked_ids[curr_idx]
                
                # STRICTLY exclude the current character
                if character_id is not None and curr_char_id == int(character_id):
                    continue
                
                # Get schedule for this character for today
                schedule_query = """
                    SELECT dungeon_id FROM character_schedules 
                    WHERE character_id = ? AND day = ?
                """
                schedule_rows = cursor.execute(schedule_query, (curr_char_id, current_day_name)).fetchall()
                scheduled_dungeon_ids = [row[0] for row in schedule_rows]
                
                if not scheduled_dungeon_ids:
                    continue
                    
                target_dungeons = []
                # If we are checking for a specific dungeon
                if check_dungeon_id is not None:
                     d_id_int = int(check_dungeon_id)
                     if d_id_int in scheduled_dungeon_ids:
                         target_dungeons = [d_id_int]
                     else:
                         continue
                else:
                    target_dungeons = scheduled_dungeon_ids
                    
                # Check completion for each target dungeon
                for d_id in target_dungeons:
                    dungeon_meta_query = "SELECT entry_limit, entry_period, reset_day FROM dungeons WHERE id = ?"
                    dungeon_meta = cursor.execute(dungeon_meta_query, (d_id,)).fetchone()
                    
                    if not dungeon_meta:
                        continue
                        
                    entry_limit, entry_period, reset_day = dungeon_meta
                    
                    count, _ = get_dungeon_stats(cursor, d_id, curr_char_id, entry_period, reset_day)
                    
                    is_completed = False
                    if entry_limit and entry_limit > 0:
                        if count >= entry_limit:
                            is_completed = True
                    else:
                        if count >= 1:
                            is_completed = True
                            
                    if not is_completed:
                        return {
                            "id": curr_char_id,
                            "name": tracked_map[curr_char_id]
                        }
            return None

        # Pass 1: Try to find someone for the specific dungeon (if provided)
        recommendation = None
        if dungeon_id is not None:
            recommendation = find_candidate(check_dungeon_id=dungeon_id)
            
        # Pass 2: If no recommendation yet (or no dungeon_id provided), find ANY next character
        if recommendation is None:
            recommendation = find_candidate(check_dungeon_id=None)
            
        if recommendation:
            return json.dumps({
                "data": {
                    "recommendation": recommendation,
                    "isAllDone": False
                }
            })

        # If we reached here, no suitable character was found for the request.
        # Check if ALL schedules are done globally (isAllDone = True)
        all_done = check_all_tasks_done(cursor)
        
        return json.dumps({
            "data": {
                "recommendation": None,
                "isAllDone": all_done
            }
        })
        
    except Exception as e:
        print(f"Error in get_recommendation: {e}")
        return json.dumps({"data": {"recommendation": None, "isAllDone": False}})


def get_inventory(DB):
    try:
        cursor = DB.cursor()
        
        # Get all items and their stacks with owners
        query = """
            SELECT i.id as item_id, i.name, s.quantity, s.id as stack_id, 
                   GROUP_CONCAT(COALESCE(c.id, 'Shared')) as owners,
                   i.is_sharable
            FROM inventory_stacks s
            JOIN items i ON s.item_id = i.id
            JOIN inventory_ownership o ON s.id = o.stack_id
            LEFT JOIN characters c ON o.character_id = c.id
            GROUP BY s.id
            ORDER BY i.id
        """
        rows = cursor.execute(query).fetchall()

        inventory = []
        for row in rows:
            inventory.append({
                "itemId": row[0],
                "name": row[1],
                "quantity": row[2],
                "stackId": row[3],
                "owners": row[4],
                "isSharable": bool(row[5])
            })
            
        return json.dumps({"data": inventory})
    except Exception as e:
        print(f"Error in get_inventory: {e}")
        return None

def update_inventory_item(DB, payload):
    try:
        cursor = DB.cursor()
        stack_id = payload.get("stackId")
        new_quantity = payload.get("quantity")
        target_character_id = payload.get("characterId", "KEEP_CURRENT")

        if stack_id is None:
            return None

        # 1. Get current info
        cursor.execute("""
            SELECT s.item_id, s.quantity, i.is_sharable 
            FROM inventory_stacks s
            JOIN items i ON s.item_id = i.id
            WHERE s.id = ?
        """, (stack_id,))
        res = cursor.fetchone()
        if not res:
            return None
        item_id, current_qty, is_sharable = res

        # 2. Determine final quantity to transfer/keep
        final_qty = max(0, new_quantity if new_quantity is not None else current_qty)

        # 3. Handle Move (e.g., to Warehouse)
        if target_character_id != "KEEP_CURRENT":
            # Enforcement: cannot move to warehouse (NULL) if not sharable
            if not is_sharable and target_character_id is None:
                return json.dumps({"error": "ITEM_NOT_SHARABLE"})

            # Remove the original rows entirely as requested
            cursor.execute("DELETE FROM inventory_ownership WHERE stack_id = ?", (stack_id,))
            cursor.execute("DELETE FROM inventory_stacks WHERE id = ?", (stack_id,))

            # Check for an existing stack with the same item and target owner (Warehouse if None)
            if target_character_id is None:
                cursor.execute("""
                    SELECT s.id FROM inventory_stacks s
                    JOIN inventory_ownership o ON s.id = o.stack_id
                    WHERE s.item_id = ? AND o.character_id IS NULL
                """, (item_id,))
            else:
                cursor.execute("""
                    SELECT s.id FROM inventory_stacks s
                    JOIN inventory_ownership o ON s.id = o.stack_id
                    WHERE s.item_id = ? AND o.character_id = ?
                """, (item_id, target_character_id))
            
            duplicate = cursor.fetchone()

            if duplicate:
                dup_id = duplicate[0]
                cursor.execute("UPDATE inventory_stacks SET quantity = quantity + ? WHERE id = ?", (final_qty, dup_id))
            else:
                cursor.execute("INSERT INTO inventory_stacks (item_id, quantity) VALUES (?, ?)", (item_id, final_qty))
                new_stack_id = cursor.lastrowid
                cursor.execute("INSERT INTO inventory_ownership (stack_id, character_id) VALUES (?, ?)", (new_stack_id, target_character_id))
        else:
            cursor.execute("UPDATE inventory_stacks SET quantity = ? WHERE id = ?", (final_qty, stack_id))

        DB.commit()
        return json.dumps({"data": "ok"})
    except Exception as e:
        print(f"Error in update_inventory_item: {e}")
        return None

def grant_inventory_item(DB, character_id, item_id, quantity):
    try:
        cursor = DB.cursor()
        
        # Check if character already has a stack of this item
        cursor.execute("""
            SELECT s.id, s.quantity 
            FROM inventory_stacks s
            JOIN inventory_ownership o ON s.id = o.stack_id
            WHERE s.item_id = ? AND o.character_id = ?
        """, (item_id, character_id))
        
        res = cursor.fetchone()
        
        if res:
            stack_id, current_qty = res
            cursor.execute("UPDATE inventory_stacks SET quantity = quantity + ? WHERE id = ?", (quantity, stack_id))
        else:
            # Create a fresh stack for the character
            cursor.execute("INSERT INTO inventory_stacks (item_id, quantity) VALUES (?, ?)", (item_id, quantity))
            new_stack_id = cursor.lastrowid
            cursor.execute("INSERT INTO inventory_ownership (stack_id, character_id) VALUES (?, ?)", (new_stack_id, character_id))
            
        DB.commit()
        return True
    except Exception as e:
        print(f"Error in grant_inventory_item: {e}")
        return False

def grant_void_rewards(DB, character_id, dungeon_id, floor):
    """
    Grants rewards for Void dungeons based on the floor reached.
    Floor 1: 1 Big, 0 Small
    Floor 2: 1 Big, 1 Small
    Floor 3: 2 Big, 2 Small
    Floor 4: 2 Big, 3 Small
    """
    try:
        # Mapping dungeon_id to (BigFragmentID, SmallFragmentID)
        mapping = {
            10: (3, 4), # Void 1
            11: (5, 6), # Void 2
            12: (7, 8)  # Void 3
        }
        
        if dungeon_id not in mapping:
            return False
            
        big_id, small_id = mapping[dungeon_id]
        
        # Determine quantities
        big_qty = 0
        small_qty = 0
        
        if floor == 1:
            big_qty = 1
            small_qty = 0
        elif floor == 2:
            big_qty = 1
            small_qty = 1
        elif floor == 3:
            big_qty = 1
            small_qty = 2
        elif floor >= 4:
            big_qty = 1
            small_qty = 3
            
        if big_qty > 0:
            grant_inventory_item(DB, character_id, big_id, big_qty)
        if small_qty > 0:
            grant_inventory_item(DB, character_id, small_id, small_qty)
            
        return True
    except Exception as e:
        print(f"Error in grant_void_rewards: {e}")
        return False

def get_items(DB):
    try:
        cursor = DB.cursor()
        rows = cursor.execute("SELECT id, name, is_sharable FROM items ORDER BY id").fetchall()
        
        items = []
        for row in rows:
            items.append({
                "id": row[0],
                "name": row[1],
                "isSharable": bool(row[2])
            })
            
        return json.dumps({"data": items})
    except Exception as e:
        print(f"Error in get_items: {e}")
        return None
