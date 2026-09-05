-- ==============================================================================
-- LEGACY REFERENCE ONLY — do not execute this file in a new environment.
--
-- The versioned implementation lives in supabase/migrations/. Apply it through
-- the Supabase CLI (`supabase db reset` locally; `supabase db push` remotely).
-- This historical file remains only to preserve the original bootstrap script.
-- Its original RLS policies do not enforce the edition lock/deadline.
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuários (vinculada ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para profiles:
-- Qualquer um pode ler perfis (necessário para placar/leaderboard)
CREATE POLICY "Perfis são visíveis publicamente" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Usuário autenticado só pode atualizar seu próprio perfil
CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger para criar o perfil automaticamente quando um usuário se cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Tabela de Votos / Palpites
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  category_id TEXT NOT NULL,
  nominee_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Um usuário só pode ter um voto por categoria em cada ano
  CONSTRAINT unique_user_year_category UNIQUE (user_id, year, category_id)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_votes_user_year ON public.votes (user_id, year);
CREATE INDEX IF NOT EXISTS idx_votes_year_category ON public.votes (year, category_id);

-- Habilitar RLS em votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para votes:
-- Leituras: qualquer um pode ler os votos (para estatísticas e ranking)
CREATE POLICY "Votos são visíveis publicamente" 
  ON public.votes FOR SELECT 
  USING (true);

-- Inserção: usuário autenticado só pode inserir voto em seu próprio nome
CREATE POLICY "Usuários podem inserir seus próprios votos" 
  ON public.votes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Atualização: usuário autenticado só pode atualizar seu próprio voto
CREATE POLICY "Usuários podem atualizar seus próprios votos" 
  ON public.votes FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Remoção: usuário pode deletar seu próprio voto (ex: limpar bolão)
CREATE POLICY "Usuários podem deletar seus próprios votos" 
  ON public.votes FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. Função auxiliar para buscar a distribuição de chutes comunitários por ano
CREATE OR REPLACE FUNCTION get_community_votes_distribution(p_year INTEGER)
RETURNS TABLE (
  category_id TEXT,
  nominee_id TEXT,
  total_votes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.category_id,
    v.nominee_id,
    COUNT(*)::BIGINT AS total_votes
  FROM public.votes v
  WHERE v.year = p_year
  GROUP BY v.category_id, v.nominee_id
  ORDER BY v.category_id, total_votes DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
