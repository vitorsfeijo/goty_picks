# GOTY Picks - Web Application 🏆

Aplicação web estática para o bolão do **The Game Awards**, desenvolvida com **React 18 + Vite + TypeScript + Tailwind CSS**.

---

## ✨ Funcionalidades
- **Navegação por Edições**: Alternador dinâmico de anos (`2025`, `2024`, etc.) consumindo dados estáticos gerados pelo scraper em `public/data/`.
- **Modo Votação (Meu Bolão)**:
  - Seleção intuitiva de indicados com destaque visual.
  - Barra de progresso dinâmica (`X / Y categorias preenchidas`).
  - Salvamento automático e persistente no `localStorage` do navegador.
  - Botão de **Compartilhar Palpites** (gera mensagem formatada com emojis para WhatsApp/Discord) e **Limpar Palpites**.
  - Filtro em tempo real para busca rápida por nome de categoria ou jogo.
- **Modo Pós-Cerimônia (Estatísticas & Vencedores)**:
  - **Scorecard Pessoal**: Acurácia percentual, número de acertos, erros e título de prestígio (*Oráculo dos Games*, *Mestre dos Palpites*...).
  - **Jogos Mais Premiados**: Tabela de classificação com os títulos que mais conquistaram troféus no ano.
  - **Lista Completa de Vencedores**: Exibe quem venceu cada categoria com destaque verde para acertos do usuário e vermelho para palpites errados.

---

## 🚀 Como Rodar Localmente

1. Entre na pasta `web/`:
   ```bash
   cd web
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse no navegador:
   👉 **http://localhost:3000**

---

## 📦 Build para Produção (GitHub Pages)

Para gerar o bundle estático pronto para deploy no GitHub Pages:
```bash
npm run build
```

Os arquivos compilados serão gerados na pasta `web/dist/`.
