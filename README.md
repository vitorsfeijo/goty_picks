# GOTY Picks 🏆

Plataforma de palpites para o **The Game Awards**. Os dados de categorias,
indicados e vencedores são coletados por um scraper Python; o frontend é uma
SPA React estática; e o Supabase cuida da autenticação, dos palpites e das
regras de acesso.

## Recursos

- Edições históricas e atuais navegáveis a partir de JSON estático.
- Palpites por categoria, progresso do bolão, compartilhamento e estatísticas
  pessoais após a cerimônia.
- Persistência local para visitantes e sincronização entre dispositivos para
  pessoas autenticadas.
- Login sem senha por link enviado por e-mail (magic link).
- Banco PostgreSQL com migrations, RLS, deadline de votação, resultados e RPCs
  para distribuição comunitária e leaderboard.

## Arquitetura

```text
scraper/   coleta e valida dados ──► web/public/data/
web/       SPA React/Vite ─────────► GitHub Pages
supabase/  Auth + PostgreSQL + RLS ─► votos, perfis e estatísticas
```

O scraper é a fonte de verdade para conteúdo editorial. O Supabase é a fonte
de verdade para identidade, estado da edição, votos e resultados de ranking.
Veja a descrição completa em [ARCHITECTURE.md](ARCHITECTURE.md).

## Pré-requisitos

- Node.js 20 ou superior e npm.
- Python 3.10 ou superior, caso vá executar o scraper.
- Docker Desktop e Supabase CLI, caso vá executar o backend localmente.

## Executar o frontend

```powershell
cd web
npm install
Copy-Item .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

Sem as variáveis do Supabase, a aplicação continua funcional em modo local:
os palpites são armazenados somente no navegador. Para habilitar login e
sincronização, preencha `web/.env.local`:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-anon-key>
```

Esses valores são próprios para o cliente. Nunca use ou publique uma chave
`service_role` no frontend.

Para criar o bundle de produção:

```powershell
cd web
npm run build
```

## Executar o backend localmente

Com o Docker Desktop aberto, a partir da raiz do repositório:

```powershell
npx supabase start
npx supabase db reset
```

O primeiro comando inicia os serviços locais. O segundo recria o banco usando
todas as migrations em `supabase/migrations/` e aplica `supabase/seed.sql`.
Use `npx supabase status` para obter a URL e a chave anônima locais e copiá-las
para `web/.env.local`.

As migrations são append-only. Para uma alteração de banco:

```powershell
npx supabase migration new nome_da_alteracao
```

Não execute `supabase/supabase_schema.sql` em um ambiente novo: ele é apenas
uma referência histórica. A implementação ativa está em
`supabase/migrations/`.

### Autenticação local e hospedada

O projeto usa magic link por e-mail. Para desenvolvimento local, o Supabase
exibe os e-mails no Mailpit da stack local. No projeto hospedado, habilite o
provedor de e-mail e configure SMTP antes do lançamento.

Em **Authentication → URL Configuration** do projeto hospedado, inclua:

- `http://localhost:3000`
- a URL final do GitHub Pages

Isso permite que o usuário retorne à aplicação depois de abrir o link de
acesso recebido por e-mail.

## Executar o scraper

```powershell
cd scraper
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py --year 2025
```

O exportador atualiza `scraper/data/` e sincroniza os JSONs para
`web/public/data/`. Para testar o scraper:

```powershell
cd scraper
python -m unittest discover tests
```

## Fluxo de uma edição

1. O scraper publica os indicados em `web/public/data/<ano>/nominees.json`.
2. Um processo administrativo cria a edição no Supabase com status `open` e um
   prazo em `votes_close_at`.
3. Usuários autenticados salvam seus votos; o RLS aceita mudanças apenas antes
   do prazo.
4. A administração altera o status para `locked` na cerimônia e, ao final,
   publica os vencedores como `concluded`.
5. A Edge Function `sync-edition-results` sincroniza os IDs vencedores para que
   o leaderboard possa ser calculado no banco.

O endpoint administrativo e seu segredo estão detalhados em
[supabase/functions/sync-edition-results/README.md](supabase/functions/sync-edition-results/README.md).

## CI/CD e deploy

- [Validate Supabase](.github/workflows/supabase-validate.yml) inicia a stack
  local em CI e valida que migrations e seed recriam o banco.
- [Deploy Supabase migrations](.github/workflows/supabase-deploy.yml) é manual
  e usa o ambiente protegido `production` no GitHub.

Antes do primeiro deploy, configure no ambiente `production` do GitHub:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

E configure o segredo de runtime da Edge Function:

```powershell
npx supabase secrets set SYNC_EDITION_SECRET=<valor-longo-aleatorio>
```

## Estrutura

```text
goty-picks/
├── scraper/     # Coleta, validação e exportação dos dados do TGA
├── supabase/    # Migrations, RLS, seed, Edge Functions e documentação
├── web/         # React + Vite + TypeScript + Tailwind
├── .github/     # Validação e deploy por GitHub Actions
└── ARCHITECTURE.md
```

## Documentação por módulo

- [Arquitetura](ARCHITECTURE.md)
- [Scraper](scraper/README.md)
- [Frontend](web/README.md)
- [Backend Supabase](supabase/README.md)
