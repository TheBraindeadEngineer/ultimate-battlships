use diesel::pg::PgConnection;
use diesel::prelude::*;
use dotenvy::dotenv;
use std::env;

use crate::models::*;

fn establish_connection() -> PgConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    PgConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Error connection to {}", database_url))
}

pub fn get_all_games() -> Option<Vec<Game>> {
    use crate::schema::games::dsl::*;

    let connection = &mut establish_connection();
    let results = games.load::<Game>(connection);
    match results {
        Ok(results) => Some(results),
        Err(_) => None,
    }
}
