-- add characters table
-- depends:

CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY ASC,
  name TEXT NOT NULL,
  tracking BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO characters (name) VALUES
('elesis'), ('lire'), ('arme'),
('lass'), ('ryan'), ('ronan'),
('amy'), ('jin'), ('sieghart'),
('mari'), ('dio'), ('zero'),
('rey'), ('lupus'), ('lin'),
('azin'), ('holy'), ('edel'),
('veigas'), ('decane'), ('ai'),
('kallia'), ('uno'), ('iris');

