use crate::schema::games;
use diesel::prelude::*;

//0 Empty
//1 Ship
//2 Destroyed
//3 Hit
//4 Miss

pub enum FireMessage {
    Empty,
    Ship,
    Hit,
    Miss,
    Destroyed,
    WinA,
    WinB,
    Error,
}

#[derive(Insertable)]
#[diesel(table_name = games)]
pub struct NewGame {
    pub a_a: Vec<Option<i32>>,
    pub a_b: Vec<Option<i32>>,
    pub a_c: Vec<Option<i32>>,
    pub a_d: Vec<Option<i32>>,
    pub a_e: Vec<Option<i32>>,
    pub a_f: Vec<Option<i32>>,
    pub a_g: Vec<Option<i32>>,
    pub a_h: Vec<Option<i32>>,
    pub a_i: Vec<Option<i32>>,
    pub a_j: Vec<Option<i32>>,
    pub b_a: Vec<Option<i32>>,
    pub b_b: Vec<Option<i32>>,
    pub b_c: Vec<Option<i32>>,
    pub b_d: Vec<Option<i32>>,
    pub b_e: Vec<Option<i32>>,
    pub b_f: Vec<Option<i32>>,
    pub b_g: Vec<Option<i32>>,
    pub b_h: Vec<Option<i32>>,
    pub b_i: Vec<Option<i32>>,
    pub b_j: Vec<Option<i32>>,
    pub player_a: i32,
    pub player_b: i32,
}

#[derive(Queryable, Debug, Clone)]
pub struct Game {
    pub id: i32,
    pub a_a: Vec<Option<i32>>,
    pub a_b: Vec<Option<i32>>,
    pub a_c: Vec<Option<i32>>,
    pub a_d: Vec<Option<i32>>,
    pub a_e: Vec<Option<i32>>,
    pub a_f: Vec<Option<i32>>,
    pub a_g: Vec<Option<i32>>,
    pub a_h: Vec<Option<i32>>,
    pub a_i: Vec<Option<i32>>,
    pub a_j: Vec<Option<i32>>,
    pub b_a: Vec<Option<i32>>,
    pub b_b: Vec<Option<i32>>,
    pub b_c: Vec<Option<i32>>,
    pub b_d: Vec<Option<i32>>,
    pub b_e: Vec<Option<i32>>,
    pub b_f: Vec<Option<i32>>,
    pub b_g: Vec<Option<i32>>,
    pub b_h: Vec<Option<i32>>,
    pub b_i: Vec<Option<i32>>,
    pub b_j: Vec<Option<i32>>,
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
        a_a: vec![Some(0); 10],
        a_b: vec![Some(0); 10],
        a_c: vec![Some(0); 10],
        a_d: vec![Some(0); 10],
        a_e: vec![Some(0); 10],
        a_f: vec![Some(0); 10],
        a_g: vec![Some(0); 10],
        a_h: vec![Some(0); 10],
        a_i: vec![Some(0); 10],
        a_j: vec![Some(0); 10],
        b_a: vec![Some(0); 10],
        b_b: vec![Some(0); 10],
        b_c: vec![Some(0); 10],
        b_d: vec![Some(0); 10],
        b_e: vec![Some(0); 10],
        b_f: vec![Some(0); 10],
        b_g: vec![Some(0); 10],
        b_h: vec![Some(0); 10],
        b_i: vec![Some(0); 10],
        b_j: vec![Some(0); 10],
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

fn check_for_win(game: &Game, is_player_a: bool) -> FireMessage {
    match is_player_a {
        true => {
            if check_if_all_destroyed_in_line(&game.a_a) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.a_b) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.a_c) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.a_d) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.a_e) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.a_f) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.a_g) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.a_h) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.a_i) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.a_j) == false {
                return FireMessage::Empty;
            };
            FireMessage::WinB
        }
        false => {
            if check_if_all_destroyed_in_line(&game.b_a) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.b_b) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.b_c) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.b_d) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.b_e) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.b_f) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.b_g) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.b_h) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.b_i) == false {
                return FireMessage::Empty;
            };
            if check_if_all_destroyed_in_line(&game.b_j) == false {
                return FireMessage::Empty;
            };
            FireMessage::WinA
        }
    }
}

fn check_if_all_destroyed_in_line(line: &Vec<Option<i32>>) -> bool {
    for i in line {
        if i == &Some(1) {
            return false;
        }
    }
    true
}

fn check_if_hit(line: &Vec<Option<i32>>, i: i32) -> FireMessage {
    let hit = line[i as usize];

    match hit {
        Some(0) => FireMessage::Miss,
        Some(1) => FireMessage::Hit,
        _ => FireMessage::Empty,
    }
}

pub fn fire(
    conn: &mut PgConnection,
    player_id: i32,
    at_l: i32,
    at_n: i32,
    is_player_a: bool,
) -> FireMessage {
    if at_n > 9 {
        return FireMessage::Error;
    }

    use crate::schema::games::dsl::*;

    let results = games
        .limit(1)
        .filter(player_a.eq(player_id))
        .or_filter(player_b.eq(player_id))
        .load::<Game>(conn);

    let mut game = match results {
        Ok(game) => game[0].clone(),
        Err(_) => return FireMessage::Error,
    };

    let fire_message = match is_player_a {
        true => match at_l {
            0 => check_if_hit(&game.a_a, at_n),
            1 => check_if_hit(&game.a_b, at_n),
            2 => check_if_hit(&game.a_c, at_n),
            3 => check_if_hit(&game.a_d, at_n),
            4 => check_if_hit(&game.a_e, at_n),
            5 => check_if_hit(&game.a_f, at_n),
            6 => check_if_hit(&game.a_g, at_n),
            7 => check_if_hit(&game.a_h, at_n),
            8 => check_if_hit(&game.a_i, at_n),
            9 => check_if_hit(&game.a_j, at_n),
            _ => FireMessage::Error,
        },
        false => match at_l {
            0 => check_if_hit(&game.b_a, at_n),
            1 => check_if_hit(&game.b_b, at_n),
            2 => check_if_hit(&game.b_c, at_n),
            3 => check_if_hit(&game.b_d, at_n),
            4 => check_if_hit(&game.b_e, at_n),
            5 => check_if_hit(&game.b_f, at_n),
            6 => check_if_hit(&game.b_g, at_n),
            7 => check_if_hit(&game.b_h, at_n),
            8 => check_if_hit(&game.b_i, at_n),
            9 => check_if_hit(&game.b_j, at_n),
            _ => FireMessage::Error,
        },
    };

    match is_player_a {
        true => match fire_message {
            FireMessage::Hit => match at_l {
                0 => game.b_a[0] = Some(2),
                1 => game.b_b[1] = Some(2),
                2 => game.b_c[2] = Some(2),
                3 => game.b_d[3] = Some(2),
                4 => game.b_e[4] = Some(2),
                5 => game.b_f[5] = Some(2),
                6 => game.b_g[6] = Some(2),
                7 => game.b_h[7] = Some(2),
                8 => game.b_i[8] = Some(2),
                9 => game.b_j[9] = Some(2),
                _ => {}
            },
            _ => {}
        },
        false => match fire_message {
            FireMessage::Hit => match at_l {
                0 => game.b_a[0] = Some(2),
                1 => game.b_b[1] = Some(2),
                2 => game.b_c[2] = Some(2),
                3 => game.b_d[3] = Some(2),
                4 => game.b_e[4] = Some(2),
                5 => game.b_f[5] = Some(2),
                6 => game.b_g[6] = Some(2),
                7 => game.b_h[7] = Some(2),
                8 => game.b_i[8] = Some(2),
                9 => game.b_j[9] = Some(2),
                _ => {}
            },
            _ => {}
        },
    };

    match check_for_win(&game, is_player_a) {
        FireMessage::WinA => FireMessage::WinA,
        FireMessage::WinB => FireMessage::WinB,
        _ => fire_message,
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
