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
    entry_limit INTEGER,
    entry_period TEXT CHECK (
        entry_period IN ('daily', 'weekly')
    ),
    reset_day INTEGER CHECK (reset_day BETWEEN 0 AND 6),
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
        entry_limit,
        entry_period,
        reset_day,
        accent_color
    )
VALUES (
        'the-crucible',
        'The Crucible',
        'hero-dungeon',
        3,
        'weekly',
        3,
        '#f95e16'
    ),
    (
        'sanctum-of-destruction',
        'Sanctum of Destruction',
        'hero-dungeon',
        3,
        'weekly',
        3,
        '#44abef'
    ),
    (
        'wizards-labyrinth',
        'Wizard''s Labyrinth',
        'hero-dungeon',
        5,
        'weekly',
        3,
        '#5573f7'
    ),
    (
        'berkas',
        'Berkas',
        'hero-dungeon',
        1,
        'daily',
        NULL,
        '#f59e0b'
    ),
    (
        'tower-of-disappearance',
        'Tower of Disappearance',
        'hero-dungeon',
        3,
        'daily',
        NULL,
        '#8148ec'
    ),
    (
        'land-of-judgment',
        'Land of Judgment',
        'hero-dungeon',
        1,
        'daily',
        NULL,
        '#2651dc'
    ),
    (
        'infinity-cloister',
        'Infinity Cloister',
        'hero-dungeon',
        3,
        'daily',
        NULL,
        '#5c5ff6'
    ),
    (
        'abyssal-path',
        'Abyssal Path',
        'hero-dungeon',
        NULL,
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
        NULL,
        '#e73232'
    ),
    (
        'invasion',
        'Void (Invasion)',
        'void-raid-dungeon',
        2,
        'weekly',
        1,
        '#7c3aed'
    ),
    (
        'taint',
        'Void (Taint)',
        'void-raid-dungeon',
        2,
        'weekly',
        3,
        '#6d28d9'
    ),
    (
        'nightmare',
        'Void (Nightmare)',
        'void-raid-dungeon',
        2,
        'weekly',
        5,
        '#581c87'
    ),
    (
        'siege-of-teroka',
        'Siege of Teroka',
        'another-world',
        1,
        'daily',
        NULL,
        '#e90ede'
    ),
    (
        'temple-of-time',
        'Temple of Time',
        'another-world',
        1,
        'daily',
        NULL,
        '#8ac8d3'
    ),
    (
        'kounat',
        'The Great Explosion of Kounat',
        'another-world',
        1,
        'daily',
        NULL,
        '#f6f33b'
    ),
    (
        'chapel-of-eternity',
        'Chapel of Eternity',
        'another-world',
        NULL,
        NULL,
        NULL,
        '#3c3ea1'
    );