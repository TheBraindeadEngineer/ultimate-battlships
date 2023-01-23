-- Your SQL goes here
CREATE TABLE looking_for_game (
    id SERIAL PRIMARY KEY,
    player_id SERIAL NOT NULL,
    CONSTRAINT fk_player FOREIGN KEY(player_id) REFERENCES users(id)
)