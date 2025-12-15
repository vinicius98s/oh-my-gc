-- create character_schedules table
-- depends: 20250703_02_nHRg8-add-dungeons-table

CREATE TABLE IF NOT EXISTS character_schedules (
  id INTEGER PRIMARY KEY ASC,
  character_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  dungeon_id INTEGER NOT NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id),
  FOREIGN KEY (dungeon_id) REFERENCES dungeons(id)
);
