# Diagnóstico e Plano de Testes — Scraper Python (`scraper/`) 🐍

Este documento detalha a cobertura atual de testes do crawler e parser do The Game Awards, identifica as lacunas de robustez e apresenta o plano de expansão de testes unitários e de integridade de dados.

---

## 1. Diagnóstico Atual

| Camada / Escopo | Estado Atual | Ferramentas | O que está coberto / O que falta |
| :--- | :---: | :--- | :--- |
| **Parsing & Utilitários** | 🟢 **Parcial** | `unittest` | Coberto: `slugify`, `clean_text`, `split_nominee_text` e merge de manifestos.<br>Falta: casos de borda de HTML (tabelas sem sub-listas, empates, células mescladas). |
| **Rede & Crawler** | ❌ **0 testes** | Nenhuma | Nenhuma cobertura com mocks para erros 404, rate limits (429), timeouts e política de retentativas (*backoff*). |
| **Integridade de Dados (Schema)** | ❌ **0 testes** | Nenhuma | Nenhum teste que valide se todas as edições em disco (`data/2014` a `data/2026`) respeitam rigidamente os schemas Pydantic. |
| **Integração no CI/CD** | 🟢 **Ativo** | GitHub Actions | Executa `python -m unittest discover tests` no workflow `.github/workflows/scraper-test.yml`. |

---

## 2. Riscos e Lacunas Críticas

1. **Comportamento em Falhas de Rede e 404s (`scraper/src/crawler.py`)**:
   - Quando uma edição futura não existe na Wikipedia (como o TGA 2026 antes da criação do artigo), o crawler dispara `CeremonyPageNotFoundError`.
   - Se o crawler sofrer instabilidade ou bloqueio da Wikipedia (HTTP 429 / 503), a rotina de retentativas com `time.sleep` pode travar ou esgotar sem que tenhamos garantias automatizadas sobre o comportamento esperado.

2. **Variações Estruturais nas Tabelas da Wikipedia (`scraper/src/parser.py`)**:
   - As edições de 2014 a 2016 e as futuras nem sempre seguem o mesmo padrão exato de listas aninhadas `<ul><li>` com `<b>` para vencedores.
   - Podem ocorrer indicações sem desenvolvedora/publisher, nomes de jogos contendo hífens (ex: *NieR:Automata - Game of the YoRHa Edition*) e caracteres especiais.

3. **Inconsistências Silenciosas nos Arquivos JSON**:
   - Se uma categoria tiver um `winner_id` que não bate com nenhum `nominee.id`, o frontend exibe o cabeçalho como "A anunciar" ou quebra as estatísticas.
   - Atualmente, não há teste no CI que garanta que os 13 arquivos JSON gerados estão 100% íntegros e consistentes entre si.

---

## 3. Plano de Implementação de Testes

### A. Testes de Rede com Mocks (`tests/test_crawler.py`)

Utilizar `unittest.mock` para simular cenários de rede sem disparar requisições reais para a Wikipedia:
- [ ] **HTTP 404 Imediato**: Verificar se `CeremonyPageNotFoundError` é lançado na primeira tentativa sem executar retentativas desnecessárias.
- [ ] **Retentativas e Backoff**: Simular falha transitória (HTTP 500 ou `requests.Timeout`) na 1ª e 2ª tentativa, com sucesso na 3ª, validando os intervalos.
- [ ] **Esgotamento de Tentativas**: Simular falha persistente e verificar se lança `RuntimeError` após atingir o `max_retries`.
- [ ] **Headers e User-Agent**: Validar se o cabeçalho customizado exigido pela Wikimedia Foundation está sendo enviado corretamente.

---

### B. Testes de Casos de Borda do Parser (`tests/test_parser_edge_cases.py`)

- [ ] **Empates (*Ties*)**: Categorias com 2 vencedores marcados com `‡` ou negrito.
- [ ] **Células sem Lista**: Células `<td>` que contêm texto puro ou quebras `<br>` em vez de tags `<ul><li>`.
- [ ] **Limpeza de Nomes Complexos**: Validação de jogos como *Baldur's Gate III*, *Grand Theft Auto V*, títulos com numerais romanos e caracteres japoneses.
- [ ] **Categorias sem Indicados**: Garantir que uma tabela de categorias vazia (ex: anúncio prévio sem indicados) retorna lista vazia `[]` sem estourar exceção.

---

### C. Teste de Integridade de Todo o Catálogo (`tests/test_catalog_integrity.py`)

Criar uma suíte de teste que roda sobre todos os arquivos em `scraper/data/`:
```python
class TestCatalogIntegrity(unittest.TestCase):
    def test_all_editions_comply_with_pydantic_schema(self):
        # Percorre data/2014 a data/2026
        # Valida com Edition.model_validate(json_data)
        ...

    def test_winner_id_exists_in_nominees(self):
        # Garante que todo winner_id aponta para um nominee.id real
        ...

    def test_no_duplicate_nominee_ids(self):
        # Garante que nenhum id de indicado se repete na mesma categoria
        ...
```

---

### D. Execução dos Testes

Comando local para rodar toda a suíte:
```bash
python -m unittest discover tests
```

Com relatório de cobertura (opcional com `coverage`):
```bash
pip install coverage
coverage run -m unittest discover tests
coverage report -m
```
