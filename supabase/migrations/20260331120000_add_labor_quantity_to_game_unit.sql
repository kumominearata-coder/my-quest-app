-- 作業台の同時加工個数。所要時間はアプリ側で recipe.duration * labor_quantity とする。
alter table public.game_unit
  add column if not exists labor_quantity integer;

comment on column public.game_unit.labor_quantity is
  '作業台(labor)時の加工個数。探査(mission)時は null。';
