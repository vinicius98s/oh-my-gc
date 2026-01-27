-- Add penalty check to dungeons entries
-- depends: 20251214_01_HBiJB-create-character-schedules-table  20251229_01_add-character-details  20260107_01_7ZtiU-add-inventory

ALTER TABLE dungeons_entries
ADD COLUMN has_penalty BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE dungeons_entries ADD COLUMN floor INTEGER;