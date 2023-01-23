-- Your SQL goes here
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    board JSONB NOT NULL,
    player_a SERIAL NOT NULL,
    player_b SERIAL NOT NULL,
    CONSTRAINT fk_player_a FOREIGN KEY(player_a) REFERENCES users(id),
    CONSTRAINT fk_player_b FOREIGN KEY(player_b) REFERENCES users(id)
)