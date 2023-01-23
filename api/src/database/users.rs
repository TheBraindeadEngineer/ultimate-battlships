use crate::schema::users;
use diesel::prelude::*;
use diesel::PgConnection;

#[derive(Insertable)]
#[diesel(table_name = users)]
pub struct NewUser<'a> {
    pub username: &'a str,
    pub password: &'a str,
}

#[derive(Queryable)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub password: String,
}

pub fn insert_user(conn: &mut PgConnection, username: &str, password: &str) -> Option<User> {
    let new_user = NewUser { username, password };

    let insert = diesel::insert_into(users::table)
        .values(&new_user)
        .get_result(conn);

    match insert {
        Ok(value) => Some(value),
        Err(_) => None,
    }
}
