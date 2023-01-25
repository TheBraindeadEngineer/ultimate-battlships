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

pub fn check_if_exists_user(conn: &mut PgConnection, check_username: &str) -> bool {
    use crate::schema::users::dsl::*;
    let results = users.filter(username.eq(check_username)).load::<User>(conn);

    match results {
        Ok(_) => true,
        Err(_) => false,
    }
}

pub fn insert_user(conn: &mut PgConnection, username: &str, password: &str) -> Option<User> {
    if check_if_exists_user(conn, username) {
        return None;
    }

    let new_user = NewUser { username, password };

    let insert = diesel::insert_into(users::table)
        .values(&new_user)
        .get_result(conn);

    match insert {
        Ok(value) => Some(value),
        Err(_) => None,
    }
}

pub fn check_user(conn: &mut PgConnection, check_username: &str, check_password: &str) -> bool {
    use crate::schema::users::dsl::*;
    let results = users
        .filter(username.eq(check_username))
        .filter(password.eq(check_password))
        .load::<User>(conn);

    match results {
        Ok(_) => true,
        _ => false,
    }
}

pub fn delete(conn: &mut PgConnection, user_id: i32) -> bool {
    use crate::schema::users::dsl::*;

    let result = diesel::delete(users.filter(id.eq(user_id))).execute(conn);

    match result {
        Ok(_) => true,
        _ => false,
    }
}
