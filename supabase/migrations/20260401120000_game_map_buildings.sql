-- マップ上の建造物位置（ユーザーごと・建造物キーごとに1行）
create table if not exists public.game_map_buildings (
  user_id text not null,
  building_key text not null,
  anchor_x integer not null,
  anchor_y integer not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, building_key)
);

comment on table public.game_map_buildings is 'ゲームハブマップ上の建造物アンカー座標（左上マス）';
