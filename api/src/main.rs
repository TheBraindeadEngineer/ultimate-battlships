mod database;
mod schema;

use database::*;

fn main() {
    println!("under construction");
    let connection = &mut establish_connection();
    let game1 = games::new(connection, 1, 2);
    println!("{:?}", game1);
    let game2 = games::new(connection, 1, 2);
    println!("{:?}", game2);
    println!("{:?}", games::get_all(connection).unwrap());
    let game = games::delete(connection, 1);
    println!("{:?}", game);
    let game = games::delete(connection, 2);
    println!("{:?}", game);
    println!("{:?}", games::get_all(connection).unwrap());
}
