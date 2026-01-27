-- Item definitions
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_sharable INTEGER NOT NULL DEFAULT 1 -- 1 for true, 0 for false
);

-- Instance of an item with a quantity
CREATE TABLE inventory_stacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
);

-- Who owns/shares the stack
CREATE TABLE inventory_ownership (
    stack_id INTEGER NOT NULL,
    character_id INTEGER, -- NULL for shared/account inventory
    PRIMARY KEY (stack_id, character_id),
    FOREIGN KEY (stack_id) REFERENCES inventory_stacks (id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters (id) ON DELETE CASCADE
);

INSERT INTO
    items (name, is_sharable)
VALUES (
        'Dimension Guardians Earrings Fragment',
        1
    ),
    (
        'Dimension Guardians Piercing Fragment',
        1
    ),
    (
        'Voidal Fragment of Invasion',
        0
    ),
    (
        'Piece of Voidal Fragment of Death',
        0
    ),
    ('Voidal Fragment of Taint', 0),
    (
        'Piece of Voidal Fragment of Life',
        0
    ),
    (
        'Voidal Fragment of Nightmare',
        0
    ),
    (
        'Piece of Voidal Fragment of Nightmare',
        0
    );