-- add dungeons table
-- depends: 20250703_01_lpcSS-add-characters-table

CREATE TABLE IF NOT EXISTS dungeons (
    id INTEGER PRIMARY KEY ASC,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (
        type IN (
            'hero-dungeon',
            'void-raid-dungeon',
            'event-dungeon',
            'another-world'
        )
    ),
    weekly_entry_limit INTEGER,
    daily_entry_limit INTEGER,
    accent_color TEXT NOT NULL DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS dungeons_entries (
    id INTEGER PRIMARY KEY ASC,
    dungeon_id INTEGER NOT NULL,
    character_id INTEGER NOT NULL,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TEXT,
    FOREIGN KEY (dungeon_id) REFERENCES dungeons (id),
    FOREIGN KEY (character_id) REFERENCES characters (id)
);

INSERT INTO
    dungeons (
        name,
        display_name,
        type,
        weekly_entry_limit,
        daily_entry_limit,
        accent_color
    )
VALUES (
        'the-crucible',
        'The Crucible',
        'hero-dungeon',
        3,
        NULL,
        '#f95e16'
    ),
    (
        'sanctum-of-destruction',
        'Sanctum of Destruction',
        'hero-dungeon',
        3,
        NULL,
        '#44abef'
    ),
    (
        'wizards-labyrinth',
        'Wizard''s Labyrinth',
        'hero-dungeon',
        5,
        NULL,
        '#5573f7'
    ),
    (
        'berkas',
        'Berkas',
        'hero-dungeon',
        NULL,
        1,
        '#f59e0b'
    ),
    (
        'tower-of-disappearance',
        'Tower of Disappearance',
        'hero-dungeon',
        NULL,
        3,
        '#8148ec'
    ),
    (
        'land-of-judgment',
        'Land of Judgment',
        'hero-dungeon',
        NULL,
        1,
        '#2651dc'
    ),
    (
        'infinity-cloister',
        'Infinity Cloister',
        'hero-dungeon',
        NULL,
        3,
        '#5c5ff6'
    ),
    (
        'abyssal-path',
        'Abyssal Path',
        'hero-dungeon',
        NULL,
        NULL,
        '#e64569'
    ),
    (
        'angry-boss',
        'Angry Boss',
        'event-dungeon',
        NULL,
        NULL,
        '#e73232'
    ),
    (
        'invasion',
        'Void (Invasion)',
        'void-raid-dungeon',
        2,
        NULL,
        '#7c3aed'
    ),
    (
        'taint',
        'Void (Taint)',
        'void-raid-dungeon',
        2,
        NULL,
        '#6d28d9'
    ),
    (
        'nightmare',
        'Void (Nightmare)',
        'void-raid-dungeon',
        2,
        NULL,
        '#581c87'
    ),
    (
        'siege-of-teroka',
        'Siege of Teroka',
        'another-world',
        NULL,
        1,
        '#e90ede'
    ),
    (
        'temple-of-time',
        'Temple of Time',
        'another-world',
        NULL,
        1,
        '#8ac8d3'
    ),
    (
        'kounat',
        'The Great Explosion of Kounat',
        'another-world',
        NULL,
        1,
        '#f6f33b'
    ),
    (
        'chapel-of-eternity',
        'Chapel of Eternity',
        'another-world',
        NULL,
        NULL,
        '#3c3ea1'
    );