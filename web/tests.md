# Diagnóstico e Plano de Testes — Frontend Web (`web/`) 🌐

Este documento mapeia o estado atual de testes no frontend, os riscos associados à falta de cobertura e o roadmap para implementação de testes unitários, de componentes e de sistema (E2E).

---

## 1. Diagnóstico Atual

| Camada / Escopo | Estado Atual | Ferramentas | O que está faltando |
| :--- | :---: | :--- | :--- |
| **Testes Unitários** | ❌ **0 testes** | Nenhuma | Testes de funções de cálculo de consenso, estatísticas comunitárias, pontuação e utilitários de texto/canvas. |
| **Testes de Hooks & Estado** | ❌ **0 testes** | Nenhuma | Testes de persistência em `localStorage`, sincronização com Supabase e controle de ciclo de vida das edições. |
| **Testes de Componentes (UI)** | ❌ **0 testes** | Nenhuma | Validação de renderização, cliques em indicados, modais de compartilhamento e edição de apelido. |
| **Testes de Sistema / E2E** | ❌ **0 testes** | Nenhuma | Simulação de jornadas completas no navegador (votação offline, persistência ao recarregar, modo anti-spoiler). |

---

## 2. Riscos e Lacunas Críticas

1. **Regressões em Cálculos Estatísticos (`web/src/utils/communityStats.ts`)**:
   - Risco de exceções em tempo de execução (`TypeError: Cannot read properties of undefined`), como ocorrido com edições futuras (ex: 2026 sem categorias) ou categorias com 0 votos registrados.
   - Falta de validação para detecção de zebras (*upsets*) e categorias de consenso.

2. **Integridade da Pontuação do Bolão (`web/src/hooks/useBallot.ts`)**:
   - A avaliação de acertos depende da convergência entre `category.winner_id` e `nominee.winner`. Sem testes automatizados, pequenas alterações podem quebrar o cálculo de acertos do usuário.
   - A lógica de mesclagem entre votos salvos localmente (`localStorage`) e votos da nuvem (Supabase) não possui testes de conflito.

3. **Geração de Imagens Sociais (`web/src/utils/generateShareCard.ts`)**:
   - Funções como quebra de texto (`wrapText`) para títulos longos e cards com dados ausentes (sem voto no GOTY) operam sem testes de regressão visual ou funcional.

4. **Ausência de Bloqueio em CI/CD**:
   - O workflow `.github/workflows/deploy-frontend.yml` executa apenas `npm run build`. Se houver bugs lógicos ou de runtime que passem pelo TypeScript, eles são publicados diretamente em produção no GitHub Pages.

---

## 3. Plano de Implementação de Testes

### A. Testes Unitários e de Componentes (Vitest + Testing Library)

#### Ferramentas recomendadas:
- **`vitest`**: Compatibilidade nativa e instantânea com Vite e TypeScript (usa o mesmo `vite.config.ts`).
- **`@testing-library/react`** e **`@testing-library/jest-dom`**: Renderização e asserções no DOM virtual.
- **`jsdom`**: Ambiente simulado de navegador no Node.js.

#### Casos de teste prioritários:

1. **`src/utils/__tests__/communityStats.test.ts`**:
   - [ ] Edição com 0 categorias (edição 2026): deve retornar estatísticas nulas com segurança, sem disparar exceção.
   - [ ] Edição com distribuição real: deve eleger a categoria mais acertada e a maior zebra corretamente.
   - [ ] Categorias empatadas ou sem vencedor anunciado.

2. **`src/hooks/__tests__/useBallot.test.ts`**:
   - [ ] Cálculo de score quando `category.winner_id` está presente vs quando apenas `nominee.winner` está ativo.
   - [ ] Gravação e recuperação de votos no `localStorage`.
   - [ ] Bloqueio de novos votos quando a edição está com status `'locked'`.
   - [ ] Upload de votos pendentes ao autenticar usuário.

3. **`src/utils/__tests__/generateShareCard.test.ts`**:
   - [ ] Quebra de linha de texto (`wrapText`) com limites variados de largura.
   - [ ] Geração de canvas com e sem voto de GOTY.

4. **Testes de Componentes**:
   - [ ] **`CategoryCard.test.tsx`**: Renderiza indicados em ordem alfabética; exibe badge de "Acertou!" ou "Errou" em edições concluídas; dispara callback ao clicar.
   - [ ] **`LeaderboardView.test.tsx`**: Filtra lista de participantes ao digitar na busca; valida tamanho de apelido no modal de edição.
   - [ ] **`ShareModal.test.tsx`**: Copia lista de votos formatada para o clipboard; aciona download de imagem PNG.

---

### B. Testes de Sistema / End-to-End (Playwright)

#### Ferramentas recomendadas:
- **`@playwright/test`**: Roda em navegadores reais (Chromium, Firefox, WebKit) de forma headless, rápida e estável.

#### Fluxos a cobrir:
1. **Jornada de Votação Local (Offline)**:
   - Acessar a aplicação na edição 2024.
   - Marcar palpites em 3 categorias.
   - Validar que a barra de progresso exibe "3 / 32 (9%)".
   - Recarregar a página (`F5`) e validar que os palpites continuam selecionados.
   - Clicar no botão "Limpar" e confirmar se os votos foram zerados.

2. **Modo Anti-Spoiler**:
   - Em edição concluída, verificar se os vencedores estão ocultos por padrão para categorias não votadas.
   - Clicar em "Revelar Todos os Vencedores" e verificar se todos os troféus aparecem.

3. **Navegação de Edições**:
   - Mudar o seletor para 2026 e validar se exibe a mensagem de indicados em breve.
   - Mudar para abas "Estatísticas" e "Classificação" garantindo ausência de erros no console.

---

### C. Scripts e CI/CD

Adicionar ao `web/package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test"
}
```

Atualizar `.github/workflows/deploy-frontend.yml`:
```yaml
- name: Run unit tests
  working-directory: web
  run: npm run test

- name: Build frontend
  working-directory: web
  run: npm run build
```
