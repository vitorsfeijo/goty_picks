# Supabase Edge Functions

Este diretório é o local reservado para **Edge Functions** do Supabase,
conforme descrito em [ARCHITECTURE.md](../ARCHITECTURE.md).

## Status Atual

Nenhuma Edge Function está implementada neste momento. O diretório existe para
estar alinhado com a estrutura prevista na arquitetura e pronto para extensões
futuras.

## Ideias para implementações futuras

- **`sync-edition-results`**: Recebe os IDs dos vencedores e sincroniza com a
  tabela `edition_results`, disparando o cálculo do leaderboard no banco.
- **Webhook pós-cerimônia**: Notifica participantes via e-mail ou push quando
  a cerimônia é concluída e o ranking final está disponível.
- **Geração de imagem de scorecard**: Cria uma imagem compartilhável com o
  resultado final de um participante para redes sociais.

## Como criar uma nova função

```powershell
npx supabase functions new nome-da-funcao
```

A função será criada em `supabase/functions/nome-da-funcao/index.ts`. Consulte
a [documentação oficial](https://supabase.com/docs/guides/functions) para
detalhes sobre desenvolvimento, testes e deploy.

## Segredos

Edge Functions podem acessar segredos configurados via:

```powershell
npx supabase secrets set CHAVE=valor
```

Nunca inclua segredos no código-fonte ou em variáveis de ambiente do frontend.
