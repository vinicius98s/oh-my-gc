-- add character details
-- depends: 20250703_01_lpcSS-add-characters-table

ALTER TABLE characters ADD COLUMN display_name TEXT;

ALTER TABLE characters ADD COLUMN color_theme TEXT;

UPDATE characters
SET
    display_name = 'Elesis',
    color_theme = '{"from": "#ef4444", "to": "#b91c1c"}'
WHERE
    name = 'elesis';

UPDATE characters
SET
    display_name = 'Lire',
    color_theme = '{"from": "#84cc16", "to": "#4d7c0f"}'
WHERE
    name = 'lire';

UPDATE characters
SET
    display_name = 'Arme',
    color_theme = '{"from": "#d946ef", "to": "#a21caf"}'
WHERE
    name = 'arme';

UPDATE characters
SET
    display_name = 'Lass',
    color_theme = '{"from": "#06b6d4", "to": "#0e7490"}'
WHERE
    name = 'lass';

UPDATE characters
SET
    display_name = 'Ryan',
    color_theme = '{"from": "#f97316", "to": "#c2410c"}'
WHERE
    name = 'ryan';

UPDATE characters
SET
    display_name = 'Ronan',
    color_theme = '{"from": "#3b82f6", "to": "#1d4ed8"}'
WHERE
    name = 'ronan';

UPDATE characters
SET
    display_name = 'Amy',
    color_theme = '{"from": "#f472b6", "to": "#be185d"}'
WHERE
    name = 'amy';

UPDATE characters
SET
    display_name = 'Jin',
    color_theme = '{"from": "#ef4444", "to": "#991b1b"}'
WHERE
    name = 'jin';

UPDATE characters
SET
    display_name = 'Sieghart',
    color_theme = '{"from": "#1f2937", "to": "#000000"}'
WHERE
    name = 'sieghart';

UPDATE characters
SET
    display_name = 'Mari',
    color_theme = '{"from": "#0ea5e9", "to": "#0369a1"}'
WHERE
    name = 'mari';

UPDATE characters
SET
    display_name = 'Dio',
    color_theme = '{"from": "#a855f7", "to": "#6b21a8"}'
WHERE
    name = 'dio';

UPDATE characters
SET
    display_name = 'Zero',
    color_theme = '{"from": "#10b981", "to": "#047857"}'
WHERE
    name = 'zero';

UPDATE characters
SET
    display_name = 'Rey',
    color_theme = '{"from": "#c026d3", "to": "#86198f"}'
WHERE
    name = 'rey';

UPDATE characters
SET
    display_name = 'Lupus',
    color_theme = '{"from": "#3b82f6", "to": "#172554"}'
WHERE
    name = 'lupus';

UPDATE characters
SET
    display_name = 'Lin',
    color_theme = '{"from": "#eab308", "to": "#a16207"}'
WHERE
    name = 'lin';

UPDATE characters
SET
    display_name = 'Azin',
    color_theme = '{"from": "#60a5fa", "to": "#2563eb"}'
WHERE
    name = 'azin';

UPDATE characters
SET
    display_name = 'Holy',
    color_theme = '{"from": "#fcd34d", "to": "#ca8a04"}'
WHERE
    name = 'holy';

UPDATE characters
SET
    display_name = 'Edel',
    color_theme = '{"from": "#93c5fd", "to": "#3b82f6"}'
WHERE
    name = 'edel';

UPDATE characters
SET
    display_name = 'Veigas',
    color_theme = '{"from": "#8b5cf6", "to": "#5b21b6"}'
WHERE
    name = 'veigas';

UPDATE characters
SET
    display_name = 'Decane',
    color_theme = '{"from": "#6b21a8", "to": "#3b0764"}'
WHERE
    name = 'decane';

UPDATE characters
SET
    display_name = 'Ai',
    color_theme = '{"from": "#22d3ee", "to": "#0ea5e9"}'
WHERE
    name = 'ai';

UPDATE characters
SET
    display_name = 'Kallia',
    color_theme = '{"from": "#f87171", "to": "#dc2626"}'
WHERE
    name = 'kallia';

UPDATE characters
SET
    display_name = 'Uno',
    color_theme = '{"from": "#1d4ed8", "to": "#172554"}'
WHERE
    name = 'uno';

UPDATE characters
SET
    display_name = 'Iris',
    color_theme = '{"from": "#10b981", "to": "#0ea5e9"}'
WHERE
    name = 'iris';