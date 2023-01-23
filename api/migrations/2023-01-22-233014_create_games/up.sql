-- Your SQL goes here
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    a INTEGER[10] NOT NULL DEFAULT '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    b INTEGER[10] NOT NULL DEFAULT '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    c INTEGER[10] NOT NULL DEFAULT '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    d INTEGER[10] NOT NULL DEFAULT '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    e INTEGER[10] NOT NULL DEFAULT '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    f INTEGER[10] NOT NULL DEFAULT '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    g INTEGER[10] NOT NULL DEFAULT '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    h INTEGER[10] NOT NULL DEFAULT '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    i INTEGER[10] NOT NULL DEFAULT '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    j INTEGER[10] NOT NULL DEFAULT '{0, 0, 0, 0, 0, 0, 0, 0, 0, 0}',
    player_a SERIAL NOT NULL,
    player_b SERIAL NOT NULL,
    CONSTRAINT fk_player_a FOREIGN KEY(player_a) REFERENCES users(id),
    CONSTRAINT fk_player_b FOREIGN KEY(player_b) REFERENCES users(id)
)