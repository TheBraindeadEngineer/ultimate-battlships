use crate::schema::looking_for_game;
use diesel::prelude::*;

#[derive(Insertable)]
#[diesel(table_name = looking_for_game)]
pub struct NewLookingForGame {
    pub player_id: i32,
}

#[derive(Queryable)]
pub struct LookingForGame {
    pub id: i32,
    pub player_id: i32,
}
