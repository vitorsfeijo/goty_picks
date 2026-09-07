# Arquitetura e Implementação Geral - GOTY Picks 🏆

Este documento descreve detalhadamente a implementação global do projeto, a divisão de responsabilidades entre os módulos, o fluxo de dados e o funcionamento de ponta a ponta.

---

## 1. Visão Geral do Sistema

O **GOTY Picks** é uma aplicação **JAMstack** desacoplada com backend serverless:

```text
┌────────────────┐        Gera JSONs        ┌────────────────────────┐
│ Scraper Python │ ───────────────────────► │ web/public/data/       │
└────────────────┘                          └────────────────────────┘
                                                         │
                                               Lê dados estáticos
                                                         │
                                                         ▼
┌────────────────┐      Autentica / Votos   ┌────────────────────────┐
│  Supabase BaaS │ ◄──────────────────────► │ Frontend React / Vite  │
└────────────────┘                          └────────────────────────┘
```

1. **Scraper (`scraper/`)**: Extrai, valida e gera arquivos JSON contendo todas as categorias, indicados e vencedores do The Game Awards (2014 a 2026).
2. **Frontend (`web/`)**: SPA React com TypeScript e Tailwind CSS hospedada no GitHub Pages. Não depende de servidor Node rodando.
3. **Backend (`supabase/`)**: Banco de dados PostgreSQL com Row Level Security (RLS), autenticação OAuth (Google, Discord, GitHub) e funções RPC para cálculo de ranking e agregação de votos.

---

## 2. Mapa das Pastas e seus `implementation.md`

Cada módulo possui sua própria documentação profunda de implementação:

- [`scraper/implementation.md`](scraper/implementation.md): Explica o crawler, parsers da Wikipédia, modelo Pydantic e o exportador de manifestos.
- [`supabase/implementation.md`](supabase/implementation.md): Explica o schema relacional, as migrations, as políticas de segurança RLS e as RPCs estatísticas.
- [`web/implementation.md`](web/implementation.md): Explica a arquitetura de componentes React, gerenciamento de estado, hooks personalizados e cálculo de métricas.

---

## 3. Ciclo de Vida de uma Edição (`EditionStatus`)

Cada edição anual passa por três estados fundamentais:

```text
[OPEN] ──────────► [LOCKED] ──────────► [CONCLUDED]
(Palpites abertos)   (Cerimônia/Congelado) (Resultados e Ranking)
```

1. **`open`** (Ex: TGA 2026 antes da cerimônia):
   - Os usuários podem votar livremente e alterar seus palpites.
   - Os votos individuais ficam privados.
2. **`locked`** (Durante a cerimônia):
   - Nenhum voto pode ser inserido ou alterado (garantido tanto pela UI quanto pelo RLS no PostgreSQL).
   - Os palpites tornam-se públicos para transparência da competição.
3. **`concluded`** (Após a revelação dos vencedores):
   - Os vencedores oficiais são confrontados com os palpites.
   - O Leaderboard é calculado e liberado.
   - Nas edições retrospectivas (2014-2025), o modo retrospectivo permite votos afetivos livres para comparação estatística entre amigos.

---

## 4. Fluxo de Dados e Sincronização Local vs Nuvem

1. **Visitante Não Autenticado**:
   - Vota normalmente na interface.
   - Os palpites são salvos no `localStorage` do navegador (`goty_picks_votes_<ano>`).
2. **Login do Usuário**:
   - Ao fazer login (via Google, Discord, GitHub ou Magic Link), o hook `useBallot` detecta a transição.
   - Faz um merge inteligente: votos do localStorage que não existiam na nuvem são enviados via `upsert` para o Supabase.
   - Os votos salvos no banco passam a ser sincronizados em qualquer dispositivo do usuário.

---

## 5. Próximos Passos e Visão de Futuro

Consulte o documento [`future.md`](future.md) para ver as ideias planejadas (duplo bolão racional vs coração, salas privadas entre amigos, pesos por categoria e cards compartilháveis).
