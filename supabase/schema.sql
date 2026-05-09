-- Banco de Ideias — Schema Supabase
-- Execute no SQL Editor do Supabase

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- Categorias
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#F59E0B',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Tags
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null
);

-- Ideias
create table public.ideas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  urgency text check (urgency in ('baixa', 'media', 'alta')) default 'media' not null,
  status text check (status in ('bruta', 'em_desenvolvimento', 'transformada', 'arquivada')) default 'bruta' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Ideia Tags (relação N:N)
create table public.idea_tags (
  idea_id uuid references public.ideas(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (idea_id, tag_id)
);

-- Brainstorms
create table public.brainstorms (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  idea_id uuid references public.ideas(id) on delete set null,
  central_idea text not null,
  problem_solved text,
  target_audience text,
  emotion text,
  impact_phrase text,
  main_arguments text,
  local_examples text,
  tone text check (tone in ('firme', 'emocional', 'institucional', 'popular', 'provocativo', 'tecnico', 'esperancoso')) default 'emocional',
  format text check (format in ('video', 'legenda', 'discurso', 'release', 'story', 'carrossel', 'audio', 'site')) default 'video',
  free_notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Textos
create table public.texts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  idea_id uuid references public.ideas(id) on delete set null,
  brainstorm_id uuid references public.brainstorms(id) on delete set null,
  title text not null,
  content text,
  category_id uuid references public.categories(id) on delete set null,
  status text check (status in ('rascunho', 'revisar', 'pronto', 'gravado', 'publicado', 'arquivado')) default 'rascunho' not null,
  format text check (format in ('video', 'legenda', 'discurso', 'release', 'story', 'carrossel', 'audio', 'site')) default 'video' not null,
  scheduled_date date,
  published_link text,
  notes text,
  word_count integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Texto Tags
create table public.text_tags (
  text_id uuid references public.texts(id) on delete cascade not null,
  tag_id uuid references public.tags(id) on delete cascade not null,
  primary key (text_id, tag_id)
);

-- Gerações de IA
create table public.ai_generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  brainstorm_id uuid references public.brainstorms(id) on delete set null,
  text_id uuid references public.texts(id) on delete set null,
  type text not null,
  prompt_used text,
  result text,
  provider text check (provider in ('openai', 'anthropic', 'none')) default 'none',
  created_at timestamptz default now() not null
);

-- ============================
-- RLS (Row Level Security)
-- ============================

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_tags enable row level security;
alter table public.brainstorms enable row level security;
alter table public.texts enable row level security;
alter table public.text_tags enable row level security;
alter table public.ai_generations enable row level security;

-- Políticas: usuário acessa apenas seus próprios dados
create policy "users_own_categories" on public.categories for all using (auth.uid() = user_id);
create policy "users_own_tags" on public.tags for all using (auth.uid() = user_id);
create policy "users_own_ideas" on public.ideas for all using (auth.uid() = user_id);
create policy "users_own_brainstorms" on public.brainstorms for all using (auth.uid() = user_id);
create policy "users_own_texts" on public.texts for all using (auth.uid() = user_id);
create policy "users_own_ai_generations" on public.ai_generations for all using (auth.uid() = user_id);

create policy "users_own_idea_tags" on public.idea_tags for all
  using (exists (select 1 from public.ideas where id = idea_id and user_id = auth.uid()));

create policy "users_own_text_tags" on public.text_tags for all
  using (exists (select 1 from public.texts where id = text_id and user_id = auth.uid()));

-- ============================
-- Triggers para updated_at
-- ============================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create trigger set_ideas_updated_at before update on public.ideas
  for each row execute function public.set_updated_at();

create trigger set_brainstorms_updated_at before update on public.brainstorms
  for each row execute function public.set_updated_at();

create trigger set_texts_updated_at before update on public.texts
  for each row execute function public.set_updated_at();

-- ============================
-- Categorias padrão (execute após criar o usuário demo)
-- ============================
-- insert into public.categories (user_id, name, color) values
--   (auth.uid(), 'Desenvolvimento do Amazonas', '#F59E0B'),
--   (auth.uid(), 'Regularização Fundiária', '#10B981'),
--   (auth.uid(), 'BR-319', '#3B82F6'),
--   (auth.uid(), 'Interior do Amazonas', '#EF4444'),
--   (auth.uid(), 'Turismo', '#06B6D4'),
--   (auth.uid(), 'Saúde', '#EC4899'),
--   (auth.uid(), 'Educação', '#F97316'),
--   (auth.uid(), 'Infraestrutura', '#6B7280'),
--   (auth.uid(), 'Mandato', '#14B8A6'),
--   (auth.uid(), 'Pré-campanha', '#EAB308'),
--   (auth.uid(), 'Discursos', '#84CC16'),
--   (auth.uid(), 'Releases', '#0EA5E9'),
--   (auth.uid(), 'Ideias Brutas', '#78716C');
