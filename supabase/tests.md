# Diagnóstico e Plano de Testes — Supabase & Banco de Dados (`supabase/`) 🗄️

Este documento mapeia o estado atual de testes do banco de dados relacional PostgreSQL, das regras de segurança de nível de linha (RLS), das funções de agregação (RPC) e das Edge Functions do Supabase.

---

## 1. Diagnóstico Atual

| Camada / Escopo | Estado Atual | Ferramentas | O que está coberto / O que falta |
| :--- | :---: | :--- | :--- |
| **Migrações e Schema SQL** | 🟢 **Validado** | Supabase CLI | O workflow `.github/workflows/supabase-validate.yml` executa `supabase db reset`, garantindo que todas as tabelas, índices e triggers compilam sem erro de sintaxe. |
| **Segurança e RLS (Row Level Security)** | ❌ **0 testes** | Nenhuma | Faltam testes automatizados que garantam que um usuário não pode bisbilhotar nem sobrescrever o bolão de outro jogador. |
| **Funções RPC de Estatísticas** | ❌ **0 testes** | Nenhuma | Faltam testes das funções `get_leaderboard`, `get_community_votes_distribution` e `are_ballots_public`. |
| **Edge Function (`sync-edition-results`)** | ❌ **0 testes** | Nenhuma | Nenhum teste unitário ou de contrato cobrindo autorização por token secreto e validação de payloads. |

---

## 2. Riscos e Lacunas Críticas

1. **Vazamento de Palpites em Fase Aberta (`public.votes`)**:
   - Durante a fase aberta (`status = 'open'`), o bolão é confidencial para evitar que participantes copiem escolhas de adversários.
   - Uma regressão na política de RLS ou na função `are_ballots_public` poderia expor todos os votos de todos os usuários via API do Supabase antes do evento ao vivo.

2. **Fraude ou Envio de Votos Fora do Prazo**:
   - A política de RLS deve rejeitar estritamente inserções e atualizações caso a edição esteja com status `'locked'` ou o prazo `votes_close_at` tenha expirado. Sem testes automatizados, modificações nas migrations podem reabrir brechas de escrita.

3. **Inconsistências no Ranking Oficial (`get_leaderboard`)**:
   - O cálculo de acertos, desempates e aproveitamento percentual precisa ser testado com cenários de múltiplos participantes para garantir que a ordenação e os números do pódio (1º, 2º e 3º) sejam matematicamente exatos.

4. **Edge Function Desprotegida**:
   - A função `sync-edition-results` possui permissão de `service_role` (ignora RLS para atualizar edições e vencedores). Qualquer erro na validação do cabeçalho `Authorization: Bearer <SECRET>` ou na validação dos campos pode corromper os resultados oficiais.

---

## 3. Plano de Implementação de Testes

### A. Testes de Banco de Dados com pgTAP (`supabase/tests/database/`)

O Supabase possui suporte nativo à biblioteca de asserções SQL **pgTAP**, executada com o comando `supabase test db`.

#### 1. Testes de Ciclo de Vida e Perfil (`01_profiles.test.sql`):
- [ ] Criar um usuário simulado em `auth.users` e verificar se a trigger `public.handle_new_user` cria automaticamente o registro correspondente em `public.profiles`.
- [ ] Verificar se o usuário consegue atualizar seu próprio `display_name`, mas não o de outro usuário.

#### 2. Testes de RLS de Votos (`02_votes_rls.test.sql`):
- [ ] **Edição Aberta (`open`)**:
  - Usuário A consegue ler e salvar seus próprios votos.
  - Usuário A **não** consegue ler os votos do Usuário B (retorno vazio).
  - Usuário A **não** consegue modificar nem deletar os votos do Usuário B.
- [ ] **Edição Bloqueada (`locked`)**:
  - Inserções ou atualizações de novos votos devem falhar por violação de RLS.
  - Leitura de votos torna-se pública (Usuário A consegue ver os votos do Usuário B).
- [ ] **Modo Retrospectivo (`concluded`)**:
  - Inserções de votos são permitidas para fins recreativos, conforme política atual.

#### 3. Testes das Funções RPC (`03_statistics_rpc.test.sql`):
- [ ] **`get_community_votes_distribution`**:
  - Dispara exceção (`raise exception`) se chamada com edição em status `'open'`.
  - Retorna o agrupamento correto de votos por categoria e indicado quando `'locked'` ou `'concluded'`.
- [ ] **`get_leaderboard`**:
  - Dispara exceção se a edição não estiver em status `'concluded'`.
  - Com 3 usuários mockados (Ex: Usuário A com 10 acertos, Usuário B com 8 acertos, Usuário C com 5 acertos), verifica se as posições (#1, #2, #3) e acurácias batem perfeitamente.

---

### B. Testes da Edge Function com Deno Test

Criar `supabase/functions/sync-edition-results/index_test.ts`:
- [ ] **Sem Authorization Header**: Deve responder HTTP 401 Unauthorized.
- [ ] **Token Incorreto**: Deve responder HTTP 401 Unauthorized.
- [ ] **Método Inválido (GET/PUT)**: Deve responder HTTP 405 Method Not Allowed.
- [ ] **Payload Inválido**: Ano < 2014 ou > 2100 deve responder HTTP 400 Bad Request.
- [ ] **Resultados em Edição Não Concluída**: Tentar publicar lista de vencedores com `status = 'open'` deve responder HTTP 400.

---

### C. Execução Local e Integração no CI/CD

Comandos locais para execução:
```bash
# Iniciar o ambiente Supabase local
supabase start

# Executar a suíte de testes do banco de dados (pgTAP)
supabase test db

# Executar testes da Edge Function
deno test supabase/functions/sync-edition-results/index_test.ts
```

Adicionar no workflow `.github/workflows/supabase-validate.yml`:
```yaml
- name: Run Database Tests (pgTAP)
  run: supabase test db
```
