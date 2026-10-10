# Daniel Aiás — Dossiê Técnico & Currículo Interativo

Bem-vindo ao repositório do meu dossiê técnico e currículo interativo, hospedado no GitHub Pages. Este projeto não é apenas um currículo tradicional, mas uma demonstração viva das minhas habilidades em engenharia de sistemas, automação, observabilidade e integração com IA.

🌐 **Acesse online:** [https://leinadsaia.github.io](https://leinadsaia.github.io)

---

## 🎯 Sobre o Projeto

Este dossiê foi desenhado para atender a dois públicos distintos:
1. **Sistemas ATS (Applicant Tracking Systems)**: O código fonte (`HTML/Text`) é altamente semântico, garantindo que robôs de recrutamento e parsers de currículos extraiam informações, palavras-chave e métricas com precisão.
2. **Gestores Técnicos & Tech Recruiters**: A interface limpa, o terminal interativo e o design focado em evidências fornecem uma experiência de leitura direta, com foco em métricas reais (Uptime, MTTR, redução de toil).

## 🚀 Principais Funcionalidades

- **Terminal Interativo Integrado**: Um CLI (Command Line Interface) funcional no próprio navegador! Você pode rodar comandos como `help`, `impacto`, `ia` e `repos` para interagir com o currículo de forma programática.
- **Busca por Linguagem Natural (`ask <pergunta>`)**: O terminal conta com um motor de busca híbrido (BM25 e suporte a Embeddings/Busca Semântica via transformers.js) para responder perguntas específicas sobre o meu dossiê.
- **Integração com GitHub API**: Os repositórios públicos são listados dinamicamente chamando a API do GitHub no lado do cliente, exibindo projetos atualizados, quantidade de estrelas e forks.
- **PDF-Ready**: Totalmente preparado para impressão e exportação. Um CSS `@media print` dedicado garante que ao "Salvar como PDF", elementos interativos como o terminal e botões desapareçam, entregando um documento PDF limpo, elegante e profissional.
- **Arquitetura Vanilla & No-build**: Sem dependências pesadas, sem frameworks complexos. Apenas HTML semântico, CSS puro e Vanilla JavaScript, garantindo alta performance e carregamento instantâneo.

## 🛠️ Stack Tecnológica

- **Frontend**: HTML5 Semântico, CSS3 (com CSS Variables, Flexbox, CSS Grid), Vanilla JavaScript (ES6+).
- **Integração API**: Fetch API para GitHub REST API.
- **Busca & IA**: TF-IDF/BM25 customizado, integração opcional com Xenova/transformers.js para embeddings locais.
- **Hospedagem & CI/CD**: GitHub Pages com implantação via GitHub Actions.

## 👨‍💻 Como rodar localmente

Se você deseja explorar o código-fonte, clonar ou rodar localmente para fazer modificações:

1. Clone o repositório:
   ```bash
   git clone https://github.com/LeinadSaia/leinadsaia.github.io.git
   cd leinadsaia.github.io
   ```

2. Sirva os arquivos estáticos:
   Como não há dependências de build, você pode usar qualquer servidor HTTP simples. Por exemplo, com Python:
   ```bash
   python3 -m http.server 3000
   ```
   Ou com o `livereload`:
   ```bash
   npx livereload -p 3000
   ```

3. Abra no seu navegador:
   Acesse `http://localhost:3000`.

---
*Desenvolvido com foco em confiabilidade, alta performance e usabilidade. Assim como os sistemas que eu administro.*
