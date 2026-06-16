-- 1. TABELA DE PERFIS DE USUÁRIOS
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  meta_diaria numeric default 150.00 not null,
  km_atual numeric default 0 not null,
  troca_oleo_intervalo numeric default 1000 not null,
  ultima_troca_oleo_km numeric default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABELA DE GANHOS (ENTRADAS)
create table public.ganhos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  valor numeric not null,
  categoria text not null check (categoria in ('iFood', 'Uber', 'Lanchonete Fixa', 'Particular')),
  descricao text,
  data date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABELA DE DESPESAS E VEÍCULO (SAÍDAS)
create table public.despesas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tipo text not null check (tipo in ('Combustível', 'Manutenção', 'Outros')),
  categoria_manutencao text check (categoria_manutencao in ('Óleo', 'Relação', 'Pneu', 'Outro')),
  valor numeric not null,
  km_registro numeric,
  litros numeric,
  descricao text,
  data date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ATIVAR ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.ganhos enable row level security;
alter table public.despesas enable row level security;

-- 5. POLÍTICAS DE ACESSO (RLS POLICIES)

-- Profiles
create policy "Usuários podem ver o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem modificar o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuários podem inserir o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Ganhos
create policy "Usuários podem ver seus próprios ganhos"
  on public.ganhos for select
  using (auth.uid() = user_id);

create policy "Usuários podem adicionar seus próprios ganhos"
  on public.ganhos for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem deletar seus próprios ganhos"
  on public.ganhos for delete
  using (auth.uid() = user_id);

-- Despesas
create policy "Usuários podem ver suas próprias despesas"
  on public.despesas for select
  using (auth.uid() = user_id);

create policy "Usuários podem adicionar suas próprias despesas"
  on public.despesas for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem deletar suas próprias despesas"
  on public.despesas for delete
  using (auth.uid() = user_id);

-- 6. TRIGGER AUTOMÁTICO PARA CRIAÇÃO DE PERFIL
-- Cria um perfil padrão sempre que um novo usuário se cadastrar pelo Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, meta_diaria, km_atual, troca_oleo_intervalo, ultima_troca_oleo_km)
  values (new.id, 150.00, 0, 1000, 0);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. TRIGGER AUTOMÁTICO PARA ATUALIZAR QUILOMETRAGEM
-- Atualiza o `km_atual` do perfil se o km_registro inserido for maior
create or replace function public.handle_new_expense_km()
returns trigger as $$
begin
  if new.km_registro is not null then
    update public.profiles
    set km_atual = new.km_registro
    where id = new.user_id and new.km_registro > km_atual;
  end if;

  -- Se for troca de óleo, atualiza ultima_troca_oleo_km também
  if new.tipo = 'Manutenção' and new.categoria_manutencao = 'Óleo' and new.km_registro is not null then
    update public.profiles
    set ultima_troca_oleo_km = new.km_registro
    where id = new.user_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_expense_logged
  after insert on public.despesas
  for each row execute procedure public.handle_new_expense_km();
