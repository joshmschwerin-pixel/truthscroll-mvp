-- TruthScroll starter Supabase schema
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamp with time zone default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  verse_id text not null,
  note text not null,
  created_at timestamp with time zone default now()
);

create table highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  verse_id text not null,
  color text default 'yellow',
  created_at timestamp with time zone default now()
);

create table studies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamp with time zone default now()
);
