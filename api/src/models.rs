use diesel::prelude::*;
use serde_json::Value;

//Create

//Read
#[derive(Queryable)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub password: String,
}

#[derive(Queryable)]
pub struct Game {
    pub id: i32,
    pub board: Value,
    pub player_a: i32,
    pub player_b: i32,
}

#[derive(Queryable)]
pub struct LookingForGame {
    pub id: i32,
    pub player_id: i32,
}
