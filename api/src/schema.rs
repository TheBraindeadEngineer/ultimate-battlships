// @generated automatically by Diesel CLI.

diesel::table! {
    games (id) {
        id -> Int4,
        a -> Array<Nullable<Int4>>,
        b -> Array<Nullable<Int4>>,
        c -> Array<Nullable<Int4>>,
        d -> Array<Nullable<Int4>>,
        e -> Array<Nullable<Int4>>,
        f -> Array<Nullable<Int4>>,
        g -> Array<Nullable<Int4>>,
        h -> Array<Nullable<Int4>>,
        i -> Array<Nullable<Int4>>,
        j -> Array<Nullable<Int4>>,
        player_a -> Int4,
        player_b -> Int4,
    }
}

diesel::table! {
    looking_for_game (id) {
        id -> Int4,
        player_id -> Int4,
    }
}

diesel::table! {
    users (id) {
        id -> Int4,
        username -> Varchar,
        password -> Varchar,
    }
}

diesel::joinable!(looking_for_game -> users (player_id));

diesel::allow_tables_to_appear_in_same_query!(
    games,
    looking_for_game,
    users,
);
