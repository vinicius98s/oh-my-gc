-- add dungeons table
-- depends: 20250703_01_lpcSS-add-characters-table

CREATE TABLE IF NOT EXISTS dungeons (
  id INTEGER PRIMARY KEY ASC,
  name TEXT NOT NULL,
  weekly_entry_limit INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS dungeons_entries (
  id INTEGER PRIMARY KEY ASC,
  dungeon_id INTEGER NOT NULL,
  character_id INTEGER NOT NULL,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT,
  FOREIGN KEY (dungeon_id) REFERENCES dungeons(id),
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

INSERT INTO dungeons (name, weekly_entry_limit) VALUES
('the-crucible', 5), ('sanctum-of-destruction', 5), ('wizards-labyrinth', 5);

