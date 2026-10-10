/**
 * terminal.js — CLI interativa do dossiê.
 * Histórico (↑/↓), autocompletar (Tab), Ctrl+L para limpar, `ask` com recuperação
 * lexical (BM25) ou semântica (embeddings) quando a camada de IA estiver ativa.
 */

import { getCorpusText, getChunks, BM25 } from './corpus.js';
import { semantic } from './semantic.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const pad = (s, n) => String(s).padEnd(n, ' ');

export function initTerminal({ onScrollTo } = {}) {
  const out = document.getElementById('term-out');
  const form = document.getElementById('term-form');
  const input = document.getElementById('term-input');
  const modeEl = document.getElementById('term-mode');
  if (!out || !form || !input) return null;

  const history = [];
  let hIdx = 0;
  let bm25 = null;
  let chunks = null;
  const bootedAt = new Date();

  /* ------------------------------------------------------------ saída */
  const print = (html = '', cls = '') => {
    const div = document.createElement('div');
    div.className = `ln ${cls}`.trim();
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  };
  const text = (t = '', cls = '') => print(esc(t), cls);
  const blank = () => print('');
  const echo = (cmd) => print(`<span class="p">daniel@sre-hub:~$</span> <span class="cmd">${esc(cmd)}</span>`);

  const ensureIndex = () => {
    if (!chunks) {
      chunks = getChunks();
      bm25 = new BM25(chunks);
    }
  };

  /* ------------------------------------------------------------ comandos */
  const commands = {
    help: {
      desc: 'lista os comandos disponíveis',
      run() {
        print('<span class="h">Comandos</span>');
        Object.entries(commands)
          .filter(([, c]) => !c.hidden)
          .forEach(([name, c]) => print(`  <span class="ok">${pad(name + (c.args ? ' ' + c.args : ''), 22)}</span><span class="d">${esc(c.desc)}</span>`));
        blank();
        text('Atalhos: Tab completa · ↑/↓ histórico · Ctrl+L limpa · / foca o terminal', 'd');
      },
    },

    whoami: {
      desc: 'identificação e foco de atuação',
      run() {
        print('<span class="h">Daniel Aiás</span> <span class="d">(@LeinadSaia)</span>');
        text('Analista de Sistemas Pleno | Site Reliability Engineer (SRE) | SysAdmin Linux');
        text('Localização: Brasil | Modelo de Trabalho: Remoto / Híbrido / Presencial', 'd');
        blank();
        text('Foco: Confiabilidade de Sistemas, Engenharia de Infraestrutura Linux, Automação de Operações (No-Ops/Toil Reduction), Análise Sistêmica e Observabilidade Distribuída.');
      },
    },

    resumo: {
      desc: 'resumo profissional',
      run() {
        text(clean(document.querySelector('.summary')?.textContent));
      },
    },

    skills: {
      args: '[2.1–2.6]',
      desc: 'competências técnicas por domínio',
      run(args) {
        const panels = [...document.querySelectorAll('.tab-panel')];
        const key = (args[0] || '').replace(/[^\d]/g, '');
        if (!key) {
          print('<span class="h">Domínios</span>');
          panels.forEach((p) => {
            const n = p.querySelectorAll('.skill-list > div').length;
            const title = clean(p.querySelector('h3')?.textContent);
            const ai = p.id === 'panel-26' ? ' <span class="ai">[IA]</span>' : '';
            print(`  ${esc(pad(title, 72))}<span class="d">${n} itens</span>${ai}`);
          });
          blank();
          text('use: skills 2.2', 'd');
          return;
        }
        const panel = document.getElementById(`panel-${key}`);
        if (!panel) return text(`skills: domínio "${args[0]}" não encontrado (use 2.1 a 2.6)`, 'bad');
        print(`<span class="h">${esc(clean(panel.querySelector('h3').textContent))}</span>`);
        panel.querySelectorAll('.skill-group').forEach((g) => {
          blank();
          print(`<span class="w">▸ ${esc(clean(g.querySelector('h4').textContent))}</span>`);
          g.querySelectorAll('.skill-list > div').forEach((d) => {
            print(`  <span class="ok">${esc(clean(d.querySelector('dt').textContent))}</span>`);
            text(`    ${clean(d.querySelector('dd').textContent)}`, 'd');
          });
        });
        onScrollTo?.(`tab-${key}`);
      },
    },

    impacto: {
      desc: 'indicadores STAR (antes → depois)',
      run() {
        print('<span class="h">Matriz de resultados</span>');
        const rows = [
          ['Uptime global', '99,2%', '99,98%'],
          ['MTTD', '42 min', '3 min'],
          ['Latência p99', '1.800 ms', '42 ms'],
          ['Toil operacional', '35 h/sem', '−85%'],
          ['RTO', '—', '−70%'],
          ['RPO', '—', '< 5 min'],
          ['Parque Linux', '—', '120+ instâncias'],
          ['Falhas antecipadas', '—', '94%'],
        ];
        rows.forEach(([k, a, b]) => print(`  ${esc(pad(k, 22))}<span class="d">${esc(pad(a, 12))}</span>→  <span class="ok">${esc(b)}</span>`));
      },
    },

    ia: {
      desc: 'experiência com IA aplicada a operações',
      run() {
        print('<span class="h">IA aplicada à engenharia de operações</span> <span class="ai">AIOps · LLMOps · MLOps</span>');
        document.querySelectorAll('#ia .star-list li').forEach((li, i) => {
          blank();
          const strong = li.querySelector('strong');
          const rest = clean(li.textContent).replace(clean(strong?.textContent), '');
          print(`  <span class="ai">${String(i + 1).padStart(2, '0')}</span> <span class="h">${esc(clean(strong?.textContent))}</span>`);
          text(`     ${rest.trim()}`, 'd');
        });
      },
    },

    repos: {
      desc: 'mapeamento de repositórios GitHub',
      run() {
        const cards = document.querySelectorAll('.repo-card');
        if (!cards.length) {
          print('  <span class="d">Nenhum repositório carregado no momento.</span>');
        } else {
          cards.forEach((card) => {
            const name = card.querySelector('h3').textContent;
            const desc = card.querySelector('p').textContent;
            print(`  <span class="ok">▸</span> ${esc(pad(name, 25))}<span class="d">${esc(desc)}</span>`);
          });
        }
        blank();
        print('  <a href="https://github.com/LeinadSaia" target="_blank" rel="noopener">https://github.com/LeinadSaia</a>');
      },
    },
    pdf: {
      desc: 'salvar dossiê como PDF (abre o assistente de impressão)',
      run() {
        print('  <span class="ok">Iniciando geração de PDF...</span>');
        setTimeout(() => window.print(), 500);
      },
    },


    ask: {
      args: '<pergunta>',
      desc: 'pergunta em linguagem natural sobre o dossiê',
      async run(args) {
        const q = args.join(' ').trim();
        if (!q) return text('uso: ask <pergunta>   ex.: ask como você garante alta disponibilidade no PostgreSQL?', 'd');
        ensureIndex();
        let results;
        let mode;
        if (semantic.ready) {
          mode = 'embeddings';
          results = await semantic.search(q, 3);
        } else {
          mode = 'bm25';
          const scores = bm25.score(q);
          results = chunks
            .map((c, i) => ({ ...c, score: scores[i] }))
            .filter((c) => c.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        }
        if (!results.length || (mode === 'embeddings' && results[0].score < 0.25)) {
          text('Nenhuma evidência relevante no dossiê para essa pergunta.', 'w');
          if (!semantic.ready) text('Dica: ative a camada semântica no §06 para buscas por sentido, não só por palavras.', 'd');
          return;
        }
        print(`<span class="d">recuperação local · ${mode} · ${chunks.length} evidências</span>`);
        results.forEach((r, i) => {
          blank();
          const score = mode === 'embeddings' ? `sim ${r.score.toFixed(2)}` : `bm25 ${r.score.toFixed(2)}`;
          print(`<span class="${mode === 'embeddings' ? 'ai' : 'ok'}">[${i + 1}]</span> <span class="d">${esc(r.source)} · ${score}</span>`);
          text(`    ${r.text}`);
        });
        if (!semantic.ready) {
          blank();
          text('modo lexical. Ative a camada semântica (§06) para respostas por similaridade de sentido.', 'd');
        }
      },
    },

    slo: {
      args: '[alvo%]',
      desc: 'calcula error budget de um SLO',
      run(args) {
        const fmt = (min) => {
          const totalSec = Math.round(min * 60);
          const d = Math.floor(totalSec / 86400);
          const h = Math.floor((totalSec % 86400) / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const s = totalSec % 60;
          return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
        };
        const custom = parseFloat(String(args[0] || '').replace(',', '.').replace('%', ''));
        const targets = !Number.isNaN(custom) && custom > 0 && custom < 100 ? [custom] : [99.2, 99.9, 99.95, 99.98, 99.99];
        print(`<span class="h">Error budget</span> <span class="d">· indisponibilidade permitida</span>`);
        print(`<span class="d">  ${pad('SLO', 10)}${pad('30 dias', 16)}${pad('7 dias', 14)}24 h</span>`);
        targets.forEach((t) => {
          const f = 1 - t / 100;
          const hl = t === 99.98 ? 'ok' : t === 99.2 ? 'd' : '';
          print(`  <span class="${hl}">${pad(t.toString().replace('.', ',') + '%', 10)}${pad(fmt(43200 * f), 16)}${pad(fmt(10080 * f), 14)}${fmt(1440 * f)}</span>`);
        });
        blank();
        text('99,2% → 99,98%: o orçamento mensal caiu de 5h 45m para 8m 38s.', 'd');
      },
    },

    ls: {
      desc: 'lista arquivos publicados',
      run() {
        ['index.html', 'cv.html', 'cv-daniel-saia-sre.pdf', 'resume-plain.txt', 'README.md', '.github/workflows/deploy.yml']
          .forEach((f) => print(`  <span class="${f.endsWith('/') ? 'w' : 'ok'}">${esc(f)}</span>`));
      },
    },

    cat: {
      args: '<arquivo>',
      desc: 'exibe resume-plain.txt',
      async run(args) {
        const f = args[0];
        if (f !== 'resume-plain.txt') return text(`cat: ${f || ''}: arquivo não suportado (tente: cat resume-plain.txt)`, 'bad');
        try {
          const res = await fetch('resume-plain.txt', { cache: 'no-cache' });
          if (!res.ok) throw new Error(res.status);
          (await res.text()).split('\n').forEach((l) => text(l, l.startsWith('====') ? 'd' : ''));
        } catch (e) {
          text(`cat: falha ao ler resume-plain.txt (${e.message})`, 'bad');
        }
      },
    },

    pdf: {
      desc: 'baixa o currículo em PDF',
      run() {
        const a = document.createElement('a');
        a.href = 'cv-daniel-saia-sre.pdf';
        a.download = '';
        a.click();
        text('download iniciado: cv-daniel-saia-sre.pdf', 'ok');
      },
    },

    contato: {
      desc: 'e-mail e GitHub',
      run() {
        print('  e-mail  <a href="mailto:danielenescunha2@gmail.com">danielenescunha2@gmail.com</a>');
        print('  github  <a href="https://github.com/LeinadSaia" target="_blank" rel="noopener">github.com/LeinadSaia</a>');
      },
    },

    neofetch: {
      desc: 'resumo do sistema',
      run() {
        const ai = semantic.ready ? 'embeddings (local)' : 'bm25 · IA sob demanda';
        const art = [
          '██████╗ ███████╗',
          '██╔══██╗██╔════╝',
          '██║  ██║███████╗',
          '██║  ██║╚════██║',
          '██████╔╝███████║',
          '╚═════╝ ╚══════╝',
          '',
          '',
        ];
        const info = [
          '<span class="h">daniel</span>@<span class="h">sre-hub</span>',
          '<span class="d">──────────────────</span>',
          `<span class="w">Role</span>    Analista de Sistemas Pleno · SRE · SysAdmin`,
          `<span class="w">OS</span>      Debian · RHEL · Rocky · Ubuntu Server`,
          `<span class="w">Shell</span>   bash · python · ansible`,
          `<span class="w">IaC</span>     terraform · opentofu · github actions`,
          `<span class="w">Obs</span>     prometheus · grafana · otel · loki`,
          `<span class="w">AI</span>      ollama · vllm · ${ai}`,
        ];
        art.forEach((l, i) => print(`<span class="p">${esc(pad(l, 20))}</span>${info[i] || ''}`));
      },
    },

    uptime: {
      desc: 'tempo desta sessão',
      run() {
        const s = Math.round((Date.now() - bootedAt) / 1000);
        text(` ${new Date().toLocaleTimeString('pt-BR')} up ${Math.floor(s / 60)} min ${s % 60}s, 1 user, SLO alvo: 99,98%`);
      },
    },

    history: {
      desc: 'histórico de comandos',
      run() {
        history.forEach((h, i) => print(`  <span class="d">${String(i + 1).padStart(3)}</span>  ${esc(h)}`));
      },
    },

    clear: { desc: 'limpa a tela', run() { out.innerHTML = ''; } },

    sudo: {
      hidden: true,
      run() {
        text('daniel is not in the sudoers file. This incident will be reported.', 'bad');
        text('…brincadeira. Post-mortem sem culpa agendado. 😉'.replace(' 😉', ''), 'd');
      },
    },
    exit: { hidden: true, run() { text('logout? Aqui o SLO é 99,98%. Sessão mantida.', 'd'); } },
  };

  /* ------------------------------------------------------------ execução */
  async function run(raw) {
    const line = raw.trim();
    echo(line);
    if (!line) return;
    history.push(line);
    hIdx = history.length;
    const [name, ...args] = line.split(/\s+/);
    const cmd = commands[name.toLowerCase()];
    if (!cmd) {
      text(`${name}: comando não encontrado. Digite help.`, 'bad');
      return;
    }
    try {
      await cmd.run(args);
    } catch (e) {
      text(`erro: ${e.message}`, 'bad');
    }
    blank();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = '';
    run(v);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hIdx > 0) input.value = history[--hIdx];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      hIdx = Math.min(history.length, hIdx + 1);
      input.value = history[hIdx] ?? '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.trim().toLowerCase();
      const names = Object.keys(commands).filter((n) => !commands[n].hidden && n.startsWith(v));
      if (names.length === 1) input.value = names[0] + ' ';
      else if (names.length > 1) { echo(input.value); text(names.join('   '), 'd'); }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = '';
    }
  });

  out.addEventListener('click', () => {
    if (!window.getSelection()?.toString()) input.focus({ preventScroll: true });
  });

  window.addEventListener('semantic:ready', () => {
    if (modeEl) modeEl.textContent = 'bm25 + embeddings';
    text('[ia] camada semântica ativa — o comando ask agora busca por similaridade de sentido.', 'ai');
  });

  /* ------------------------------------------------------------ boot */
  print('<span class="h">SRE Hub</span> <span class="d">rev. 2026.10 — dossiê técnico de Daniel Aiás</span>');
  print('<span class="d">Digite</span> <span class="ok">help</span> <span class="d">para listar comandos ·</span> <span class="ok">ask</span> <span class="d">para perguntar em linguagem natural</span>');
  blank();

  return { run, focus: () => input.focus() };
}
