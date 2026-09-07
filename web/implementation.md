# Implementação Detalhada do Frontend Web 🌐

Este documento detalha a arquitetura, estrutura de componentes, hooks e fluxo de estado da aplicação React/Vite localizada em **`web/`**.

---

## 1. Estrutura de Diretórios

```text
web/src/
├── App.tsx                     # Componente raiz, layout mestre e roteamento por abas
├── main.tsx                    # Ponto de entrada React (StrictMode e renderização no DOM)
├── types/                      # Definições de tipos TypeScript
│   ├── index.ts                # Modelos da aplicação (Edition, Nominee, UserVotes, etc.)
│   └── database.ts             # Tipagem estrita completa do Supabase gerada do schema
├── lib/
│   └── supabase.ts             # Instanciação tipada do Supabase Client
├── hooks/                      # Camada de lógica e estado assíncrono
│   ├── useEditions.ts          # Carregamento do manifesto e JSONs de cada ano
│   ├── useBallot.ts            # Gerenciamento de votos, progresso e sync local/nuvem
│   ├── useAuth.ts              # Sessão de usuário e login (Google, Discord, GitHub, E-mail)
│   ├── useEditionLifecycle.ts  # Override do status da edição vindo do Supabase
│   ├── useLeaderboard.ts       # Chamada da RPC do Leaderboard
│   └── useCommunityVotes.ts    # Chamada da RPC da distribuição agregada
├── components/                 # Componentes de interface do usuário (UI)
│   ├── Navbar.tsx              # Barra superior, seletor de anos, contador e badges
│   ├── AuthButton.tsx          # Botão e modal com 1-clique OAuth e Magic Link
│   ├── ProfileAvatar.tsx       # Avatar com foto ou iniciais do usuário
│   ├── CategoryCard.tsx        # Card expansível com os indicados de cada categoria
│   ├── NomineeItem.tsx         # Item individual selecionável/votável
│   ├── BallotProgress.tsx      # Barra de progresso, botão de limpar e compartilhar
│   ├── StatsView.tsx           # Visão geral de estatísticas da edição
│   ├── ScoreSummary.tsx        # Card de desempenho individual (acertos, erros, acurácia)
│   ├── CategoryStatsTable.tsx  # Tabela com barras de porcentagem de votos da comunidade
│   └── LeaderboardView.tsx     # Pódio Top 3 e ranking geral pesquisável
└── utils/
    ├── communityStats.ts       # Agregação matemática dos votos reais
    └── shareCard.ts            # Formatação de texto para compartilhamento
```

---

## 2. Ciclo de Inicialização e Carregamento

1. **`main.tsx`**: Monta o `<App />` no elemento `#root`.
2. **`useEditions`**:
   - Lê parâmetros de URL (ex: `?year=2025`).
   - Faz o fetch de `./data/editions.json` para obter a lista de edições disponíveis.
   - Faz o fetch do arquivo específico do ano: `./data/<ano>/nominees.json`.
3. **`useEditionLifecycle`**:
   - Consulta a tabela `editions` no Supabase para saber se o status foi alterado dinamicamente (ex: de `'open'` para `'locked'` durante o evento ao vivo).
4. **`useAuth`**:
   - Verifica se há sessão ativa salva nos cookies/localStorage pelo Supabase Auth.
   - Escuta eventos `onAuthStateChange` para atualizar o estado do usuário em tempo real.
5. **`useBallot`**:
   - Carrega os votos salvos no `localStorage`.
   - Se o usuário estiver logado, faz merge com os votos salvos na nuvem e ativa a sincronização contínua.

---

## 3. Detalhamento dos Hooks Principais

### 3.1. `useBallot(activeEdition, user)`
Responsável pela experiência de votação:
- **`setVote(categoryId, nomineeId)`**:
  - Valida se a edição não está `'locked'`.
  - Atualiza o estado local imediatamente (UI otimista).
  - Persiste no `localStorage`.
  - Se `user` existir, dispara `supabase.from('votes').upsert(...)`.
- **`clearVotes()`**:
  - Remove os palpites da edição atual tanto localmente quanto do banco remoto.
- **`score`**:
  - Compara `votes[categoryId]` com os vencedores oficiais da edição e computa acertos, erros e percentual de aproveitamento.

### 3.2. `useAuth()`
- Fornece:
  - `user`: Dados do usuário logado (email, ID, metadata).
  - `signInWithOAuth(provider)`: Executa `supabase.auth.signInWithOAuth` para `'google'`, `'discord'` ou `'github'`.
  - `sendMagicLink(email)`: Envia link de acesso sem senha por e-mail via `supabase.auth.signInWithOtp`.
  - `signOut()`: Limpa a sessão.

### 3.3. `useLeaderboard(year, status, currentUserId)`
- Quando a edição está concluída (`status === 'concluded'`), chama a RPC `get_leaderboard`.
- Identifica a posição do usuário logado (`userEntry`) para destacar no topo da tela.

### 3.4. `useCommunityVotes(year, status)`
- Busca os dados de agregação via RPC `get_community_votes_distribution`.
- Alimenta o cálculo de estatísticas da comunidade com dados 100% reais do banco.

---

## 4. Componentes Chave

### 4.1. `AuthButton.tsx`
- Se o Supabase não estiver configurado (sem credenciais), exibe o indicativo gracioso `"Modo local"`.
- Quando configurado e deslogado:
  - Exibe o botão chamativo `"Entrar para salvar"`.
  - Abre popover com opções de 1 clique: **Google**, **Discord**, **GitHub** e a opção colapsável de **Magic Link por e-mail**.
- Quando autenticado:
  - Exibe o e-mail ou nome com botão de logout rápido.

### 4.2. `CategoryStatsTable.tsx`
- Exibe o card de total de palpites reais (com badge *Supabase Live*).
- Se houver votos computados:
  - Destaca o card da **Mais Acertada** e da **Maior Zebra**.
  - Exibe barras de progresso proporcionais para cada jogo indicado.
- Se não houver votos ainda na edição:
  - Exibe estado limpo e informativo convidando a votar, sem números fictícios.

### 4.3. `LeaderboardView.tsx`
- **Pódio (Top 3)**: Cards com medalhas dourada, prateada e bronze, integrados ao `ProfileAvatar`.
- **Banner do Jogador**: Se o usuário logado estiver participando, exibe uma faixa de destaque com sua posição exata, acertos e aproveitamento.
- **Tabela Completa**: Com busca textual rápida por nome de participante.
