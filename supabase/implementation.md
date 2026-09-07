# Implementação Detalhada do Backend Supabase ⚡

Este documento detalha a implementação do backend no diretório **`supabase/`**, baseado em PostgreSQL, Row Level Security (RLS) e Edge Functions.

---

## 1. Estrutura de Arquivos

```text
supabase/
├── config.toml                     # Configuração da CLI do Supabase local
├── seed.sql                        # Carga inicial para testes locais
├── schema_full.sql                 # Script consolidado com todas as 8 migrations para setup rápido
├── migrations/                     # Histórico append-only de migrations SQL
│   ├── 20260905000100_extensions.sql
│   ├── 20260905000200_profiles.sql
│   ├── 20260905000300_editions.sql
│   ├── 20260905000400_votes_and_results.sql
│   ├── 20260905000500_rls.sql
│   ├── 20260905000600_statistics.sql
│   ├── 20260906000100_edition_results_rls.sql
│   └── 20260906000200_retrospective_voting.sql
└── functions/                      # Edge Functions TypeScript/Deno
    └── README.md                   # Documentação e roadmap para Edge Functions
```

---

## 2. Modelo Relacional (Tabelas)

### 2.1. `public.profiles`
Armazena dados públicos dos jogadores.
- `id (UUID)`: Chave primária referenciando `auth.users.id` (`on delete cascade`).
- `display_name (TEXT)`: Nome público exibido no Leaderboard e pódio.
- `avatar_url (TEXT)`: Foto de perfil (importada de Google/Discord/GitHub via OAuth).
- `created_at / updated_at`: Timestamps automáticos.
- **Trigger `on_auth_user_created`**: Cria automaticamente uma linha em `profiles` sempre que um usuário se cadastra no Supabase Auth.

### 2.2. `public.editions`
Controla o status de cada ano no banco.
- `year (INT)`: Chave primária (ex: 2025, 2026).
- `status (TEXT)`: Restrito via CHECK a `'open'`, `'locked'`, `'concluded'`.
- `votes_close_at (TIMESTAMPTZ)`: Prazo limite para encerramento das votações.

### 2.3. `public.votes`
Registra cada palpite individual.
- `id (UUID)`: Chave primária.
- `user_id (UUID)`: FK para `profiles.id`.
- `year (INT)`: Ano da edição.
- `category_id (TEXT)`: Slug da categoria (ex: `'game-of-the-year'`).
- `nominee_id (TEXT)`: Slug do jogo votado (ex: `'astro-bot'`).
- `created_at / updated_at`: Timestamps.
- **Constraint UNIQUE (`user_id, year, category_id`)**: Garante que cada usuário tenha no máximo 1 voto por categoria em cada ano.

### 2.4. `public.edition_results`
Armazena os vencedores oficiais confirmados.
- `id (UUID)`: Chave primária.
- `year (INT)` e `category_id (TEXT)`: Categoria avaliada.
- `winner_nominee_id (TEXT)`: O indicado que venceu.
- **Constraint UNIQUE (`year, category_id`)**.

---

## 3. Segurança e Row Level Security (RLS)

O RLS garante que nenhuma ação indevida possa ser feita pelo cliente, mesmo que manipulem chamadas de rede:

1. **`profiles`**:
   - `SELECT`: Público (necessário para listar nomes no leaderboard).
   - `INSERT / UPDATE`: Permitido apenas para o próprio dono (`auth.uid() = id`).
2. **`votes` (Inserção e Alteração)**:
   - Política `votes_owner_modify`: Um usuário autenticado só pode inserir/atualizar/deletar seus próprios votos (`user_id = auth.uid()`).
   - Validação por função `is_edition_open(year)`: O PostgreSQL rejeita a alteração se a edição estiver `'locked'` ou se o relógio passou de `votes_close_at`.
   - **Votação Retrospectiva**: A migration `20260906000200` ajustou a função para que edições `'concluded'` anteriores permitam votos recreativos contínuos.
3. **`votes` (Leitura / Privacidade)**:
   - Enquanto a edição está `'open'`, o usuário só pode ler seus próprios votos.
   - Quando a edição passa para `'locked'` ou `'concluded'`, os votos tornam-se públicos (`are_ballots_public(year)`) para transparência do bolão.

---

## 4. Funções RPC no Banco (Remote Procedure Calls)

Para evitar carregar milhares de linhas brutas de votos no navegador, o cálculo é feito diretamente no PostgreSQL:

### 4.1. `get_leaderboard(p_year INT)`
- **Objetivo**: Gera a classificação geral de uma edição concluída.
- **Lógica Interna**:
  1. Executa um `JOIN` entre `profiles`, `votes` e `edition_results`.
  2. Conta acertos (`hits`) e total de palpites (`picks`).
  3. Calcula o aproveitamento percentual `accuracy`.
  4. Aplica função de janela `rank() over (order by hits desc, picks desc)` com critério de desempate determinístico.

### 4.2. `get_community_votes_distribution(p_year INT)`
- **Objetivo**: Retorna a contagem agregada de votos por jogo em cada categoria.
- **Lógica Interna**:
  - Verifica se a edição já foi congelada ou concluída.
  - Executa `group by category_id, nominee_id` e retorna `total_votes`.
  - Usado pelo componente `CategoryStatsTable` para renderizar as barras de porcentagem reais.
