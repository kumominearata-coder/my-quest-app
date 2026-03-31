-- Supabase の SQL Editor で 1 回実行してください（game_unit に labor_quantity が無いと 400 / PGRST204 になります）
alter table public.game_unit
  add column if not exists labor_quantity integer;

comment on column public.game_unit.labor_quantity is
  '作業台(labor)時の加工個数。探査(mission)時は null。';
