// @generated automatically by Diesel CLI.

diesel::table! {
    games (id) {
        id -> Int4,
        a_a -> Array<Nullable<Int4>>,
        a_b -> Array<Nullable<Int4>>,
        a_c -> Array<Nullable<Int4>>,
        a_d -> Array<Nullable<Int4>>,
        a_e -> Array<Nullable<Int4>>,
        a_f -> Array<Nullable<Int4>>,
        a_g -> Array<Nullable<Int4>>,
        a_h -> Array<Nullable<Int4>>,
        a_i -> Array<Nullable<Int4>>,
        a_j -> Array<Nullable<Int4>>,
        b_a -> Array<Nullable<Int4>>,
        b_b -> Array<Nullable<Int4>>,
        b_c -> Array<Nullable<Int4>>,
        b_d -> Array<Nullable<Int4>>,
        b_e -> Array<Nullable<Int4>>,
        b_f -> Array<Nullable<Int4>>,
        b_g -> Array<Nullable<Int4>>,
        b_h -> Array<Nullable<Int4>>,
        b_i -> Array<Nullable<Int4>>,
        b_j -> Array<Nullable<Int4>>,
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
