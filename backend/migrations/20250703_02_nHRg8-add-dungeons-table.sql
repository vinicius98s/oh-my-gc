-- add dungeons table
-- depends: 20250703_01_lpcSS-add-characters-table

CREATE TABLE IF NOT EXISTS dungeons (
  id INTEGER PRIMARY KEY ASC,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('hero-dungeon', 'void-raid-dungeon', 'event-dungeon')),
  weekly_entry_limit INTEGER,
  daily_entry_limit INTEGER
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

INSERT INTO dungeons (name, display_name, type, weekly_entry_limit, daily_entry_limit) VALUES
('the-crucible', 'The Crucible', 'hero-dungeon', 3, NULL),
('sanctum-of-destruction', 'Sanctum of Destruction', 'hero-dungeon', 3, NULL),
('wizards-labyrinth', "Wizard's Labyrinth", 'hero-dungeon', 3, NULL),
('berkas', 'Berkas', 'hero-dungeon', NULL, 1),
('tower-of-disappearance', 'Tower of Disappearance', 'hero-dungeon', NULL, 3),
('land-of-judgment', 'Land of Judgment', 'hero-dungeon', NULL, 1),
('infinity-cloister', 'Infinity Cloister', 'hero-dungeon', NULL, 3),
('abyssal-path', 'Abyssal Path', 'hero-dungeon', NULL, NULL),
('angry-boss', 'Angry Boss', 'event-dungeon', NULL, NULL),
('invasion', 'Void (Invasion)', 'void-raid-dungeon', 2, NULL),
('taint', 'Void (Taint)', 'void-raid-dungeon', 2, NULL),
('nightmare', 'Void (Nightmare)', 'void-raid-dungeon', 2, NULL);
