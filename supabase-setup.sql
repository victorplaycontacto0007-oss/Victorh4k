-- Ejecuta esto en Supabase SQL Editor
-- supabase.com → tu proyecto → SQL Editor → New Query

create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  rating int check (rating between 1 and 5),
  comment text not null,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  featured boolean default false,
  helpful int default 0,
  reactions int default 0,
  created_at timestamptz default now()
);

-- Permitir insertar (anon puede enviar opiniones)
alter table reviews enable row level security;

create policy "Anyone can insert reviews"
  on reviews for insert
  with check (true);

create policy "Anyone can read approved reviews"
  on reviews for select
  using (status = 'approved');

-- Para el admin (service_role puede hacer todo)
-- Las acciones de admin usan la anon key con password local,
-- asi que necesitamos una policy de update/delete abierta.
-- NOTA: en produccion usa service_role key solo en backend.
create policy "Allow all for admin operations"
  on reviews for all
  using (true)
  with check (true);
