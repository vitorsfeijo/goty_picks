# Testes

## Web e endpoint administrativo

```powershell
cd web
npm ci
npm test
npm run test:coverage
npm run build
```

`npm run test:watch` executa em modo interativo. A suíte usa Vitest,
Testing Library e jsdom. Os testes do endpoint usam o ambiente Node e as
APIs Request/Response reais, com cliente administrativo e configuração
injetados. Não precisam de credenciais ou serviços externos.

Cobertura atual:

- Estatísticas: categorias vazias, ausência de votos, percentuais, acertos,
  zebras e registros de indicados desconhecidos.
- Votação: persistência, recuperação, limpeza, troca de edição, seleção pessoal,
  bloqueio, conflitos entre cache e nuvem, upload pendente e rollback.
- Interface: ordem alfabética, seleção, bloqueio e revelação anti-spoiler.
- Endpoint: autorização, método, JSON, payload, duplicatas, publicação de
  vencedores, escrita normalizada e erros do banco.

O handler testado é o mesmo importado pela Edge Function. Estes testes
não validam o runtime Deno, o transporte real ou jornadas de navegador.

## Banco Supabase

Com Docker Desktop ativo, a partir da raiz:

```powershell
npx supabase start
npx supabase db reset
npx supabase test db
```

Execute em banco local descartável: `db reset` recria o banco. A suíte pgTAP
cria usuários e edições isolados dentro de uma transação com rollback.
Ela verifica criação de perfil, isolamento de votos e perfis, prazo,
bloqueio, votação retrospectiva, acesso anônimo, distribuição e ranking.
As políticas são exercitadas com os papéis `authenticated` e `anon`.

## CI

`web-tests.yml` valida testes, cobertura e build em pull requests e pushes
que alteram a web ou o endpoint. O deploy frontend exige testes passando.
`supabase-validate.yml` executa pgTAP após recriar o banco local.

A interface agora prioriza favoritos pessoais. Os testes verificam que uma
escolha diferente do vencedor recebe o mesmo destaque, sem pontos ou erros.
As RPCs antigas de ranking permanecem no banco para compatibilidade.
