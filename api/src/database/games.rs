use crate::schema::games;
use diesel::prelude::*;

#[derive(Insertable)]
#[diesel(table_name = games)]
pub struct NewGame {
    pub a: Vec<Option<i32>>,
    pub b: Vec<Option<i32>>,
    pub c: Vec<Option<i32>>,
    pub d: Vec<Option<i32>>,
    pub e: Vec<Option<i32>>,
    pub f: Vec<Option<i32>>,
    pub g: Vec<Option<i32>>,
    pub h: Vec<Option<i32>>,
    pub i: Vec<Option<i32>>,
    pub j: Vec<Option<i32>>,
    pub player_a: i32,
    pub player_b: i32,
}

#[derive(Queryable, Debug)]
pub struct Game {
    pub id: i32,
    pub a: Vec<Option<i32>>,
    pub b: Vec<Option<i32>>,
    pub c: Vec<Option<i32>>,
    pub d: Vec<Option<i32>>,
    pub e: Vec<Option<i32>>,
    pub f: Vec<Option<i32>>,
    pub g: Vec<Option<i32>>,
    pub h: Vec<Option<i32>>,
    pub i: Vec<Option<i32>>,
    pub j: Vec<Option<i32>>,
    pub player_a: i32,
    pub player_b: i32,
}

pub fn get_all(conn: &mut PgConnection) -> Option<Vec<Game>> {
    use crate::schema::games::dsl::*;
    let results = games.load::<Game>(conn);

    match results {
        Ok(results) => Some(results),
        Err(_) => None,
    }
}

pub fn get_for_user_id(conn: &mut PgConnection, player_id: i32) -> Option<Vec<Game>> {
    use crate::schema::games::dsl::*;
    let results = games
        .filter(player_a.eq(player_id))
        .or_filter(player_b.eq(player_id))
        .load::<Game>(conn);

    match results {
        Ok(results) => Some(results),
        Err(_) => None,
    }
}

pub fn new(conn: &mut PgConnection, player_a: i32, player_b: i32) -> Option<Game> {
    let new_game = NewGame {
        a: vec![Some(0); 10],
        b: vec![Some(0); 10],
        c: vec![Some(0); 10],
        d: vec![Some(0); 10],
        e: vec![Some(0); 10],
        f: vec![Some(0); 10],
        g: vec![Some(0); 10],
        h: vec![Some(0); 10],
        i: vec![Some(0); 10],
        j: vec![Some(0); 10],
        player_a,
        player_b,
    };

    let result = diesel::insert_into(games::table)
        .values(&new_game)
        .get_result::<Game>(conn);

    match result {
        Ok(result) => Some(result),
        Err(_) => None,
    }
}

pub fn delete(conn: &mut PgConnection, to_delete_id: i32) -> bool {
    use crate::schema::games::dsl::*;

    let result = diesel::delete(games.filter(id.eq(to_delete_id))).execute(conn);

    match result {
        Ok(_) => true,
        Err(_) => false,
    }
}
