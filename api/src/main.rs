mod database;
mod schema;

use database::*;

fn main() {
    println!("under construction");
    let connection = &mut establish_connection();
    println!("{:?}", games::get_all(connection).unwrap());
}
