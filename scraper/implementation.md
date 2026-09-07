# Implementação Detalhada do Scraper 🕷️

Este documento descreve a implementação do módulo **`scraper/`**, responsável por coletar dados da Wikipédia sobre o *The Game Awards*, normalizá-los, validá-los e exportá-los em formato JSON para o frontend.

---

## 1. Estrutura de Arquivos

```text
scraper/
├── main.py              # Ponto de entrada CLI (argument parsing e orquestração)
├── requirements.txt     # Dependências (requests, beautifulsoup4, pydantic)
├── src/
│   ├── __init__.py      # Exportações do pacote
│   ├── crawler.py       # Requisições HTTP com headers realistas e cache
│   ├── parser.py        # Análise HTML e extração de categorias/indicados
│   ├── models.py        # Modelos de validação de dados com Pydantic
│   └── exporter.py      # Salvamento em disco e mesclagem de manifestos
└── tests/
    └── test_scraper.py  # Testes unitários do parser e do exporter
```

---

## 2. Detalhamento dos Componentes

### 2.1. `src/models.py` (Validação de Dados)
Utiliza **Pydantic (v2)** para garantir a integridade dos dados coletados:
- **`Nominee`**:
  - `id`: Identificador slug único (ex: `astro-bot`).
  - `name`: Nome legível do jogo/criador (ex: `"Astro Bot"`).
  - `details`: Estúdio desenvolvedor, publisher ou informações extras (opcional).
  - `winner`: Booleano indicando se o indicado venceu a categoria.
- **`Category`**:
  - `id`: Slug da categoria (ex: `game-of-the-year`).
  - `title`: Título formatado da categoria (ex: `"Game of the Year"`).
  - `winner_id`: ID do vencedor (preenchido automaticamente caso haja vencedor).
  - `nominees`: Lista de instâncias de `Nominee`.
- **`Edition`**:
  - `year`: Ano da premiação (2014 a 2026).
  - `title`: Nome completo do evento (ex: `"The Game Awards 2025"`).
  - `status`: `"open"`, `"locked"` ou `"concluded"`.
  - `categories`: Lista de `Category`.
- **`EditionSummary`**: Resumo leve usado no manifesto `editions.json` (apenas `year`, `title`, `status`, `categories_count`, `has_winners`).

---

### 2.2. `src/crawler.py` (Camada HTTP)
- **`fetch_html(url: str, timeout: int = 15) -> str`**:
  - Executa requisições GET para a Wikipédia em inglês.
  - Define `User-Agent` moderno para evitar bloqueios 403.
  - Trata erros HTTP como 404 (para edições futuras ainda sem página) e falhas de conexão de forma graciosa.

---

### 2.3. `src/parser.py` (Extração HTML)
- **`clean_text(text: str) -> str`**:
  - Remove notas de rodapé da Wikipédia (ex: `[1]`, `[a]`), quebras de linha duplicadas e espaços em branco estranhos.
- **`slugify(text: str) -> str`**:
  - Converte títulos em identificadores URL-safe (ex: `"Best Score and Music"` ➔ `"best-score-and-music"`).
- **`parse_tga_page(html_content: str, year: int) -> Edition`**:
  - Localiza as seções *"Winners and nominees"* e tabelas `wikitable` ou listas `<ul>` de indicados.
  - Identifica vencedores que na Wikipédia aparecem em **negrito** (`<b>` / `<strong>`) ou acompanhados do símbolo `‡`.
  - Separa o nome do jogo do estúdio (geralmente separado por travessão `–` ou vírgula).
  - Normaliza os dados dentro do schema Pydantic `Edition`.

---

### 2.4. `src/exporter.py` (Exportação e Sincronização)
- **`export_edition(edition: Edition, output_dir: Path) -> Path`**:
  - Salva o arquivo `nominees.json` na pasta do ano correspondente (`data/<ano>/nominees.json`).
- **`export_editions_manifest(editions: list[EditionSummary], manifest_path: Path) -> Path`**:
  - Mantém o arquivo mestre `editions.json`.
  - **Lógica de Preservação e Mesclagem**: Ao atualizar uma edição individual, o exportador lê as edições já existentes no disco para nunca apagar os outros anos.
- **`sync_to_web(scraper_data_dir: Path, web_public_data_dir: Path)`**:
  - Copia atomicamente os arquivos gerados para `web/public/data/` para consumo direto pela SPA.

---

### 2.5. `main.py` (CLI)
Suporta diferentes modos de execução:
- `--year YYYY`: Coleta e processa um ano específico (ex: `python main.py --year 2025`).
- `--all`: Itera por todas as edições históricas (2014 até o ano atual).
- `--sync-web`: Flag para sincronizar automaticamente com `web/public/data/`.

---

### 2.6. `tests/test_scraper.py` (Suíte de Testes)
- Testa parsing com snippets HTML reais de edições passadas.
- Valida que vencedores em negrito são devidamente identificados com `winner: True`.
- Valida a mesclagem correta no `editions.json` para evitar perda de dados.
