/**
 * corpus.js — Extrai o corpus do dossiê diretamente do DOM (fonte única de verdade)
 * e fornece recuperação lexical BM25 para o comando `ask` do terminal.
 */
export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\s+/g, ' ');
}

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/** Texto integral de todas as seções marcadas com [data-corpus]. */
export function getCorpusText() {
  return [...document.querySelectorAll('[data-corpus]')].map((el) => el.textContent).join('\n');
}

/**
 * Fragmenta o dossiê em "evidências" com rótulo de origem.
 * Cada evidência é uma unidade autocontida (um item de competência, um bullet STAR etc.).
 */
export function getChunks() {
  const chunks = [];
  const push = (text, source, anchor) => {
    const t = clean(text);
    if (t.length > 12) chunks.push({ id: chunks.length, text: t, source: clean(source), anchor });
  };

  document.querySelectorAll('[data-corpus] .summary').forEach((el) => push(el.textContent, 'Resumo profissional', '#perfil'));

  document.querySelectorAll('[data-corpus] .stack-list li').forEach((el) => push(el.textContent, 'Formação & certificações', '#perfil'));

  document.querySelectorAll('[data-corpus] .skill-list > div').forEach((div) => {
    const panel = div.closest('[data-label]');
    const group = div.closest('.skill-group')?.querySelector('h4')?.textContent;
    const dt = div.querySelector('dt')?.textContent;
    const dd = div.querySelector('dd')?.textContent;
    push(`${dt}: ${dd}`, `${panel?.dataset.label ?? 'Competências'} › ${group ?? ''}`, `#${panel?.id ?? 'competencias'}`);
  });

  document.querySelectorAll('[data-corpus] .star-list li').forEach((li) => {
    const card = li.closest('[data-label]');
    push(li.textContent, card?.dataset.label ?? 'Experiência', `#${li.closest('section')?.id ?? 'impacto'}`);
  });

  document.querySelectorAll('[data-corpus] table.repo tbody tr').forEach((tr) => {
    const cells = [...tr.cells].map((c) => clean(c.textContent.replace(/([a-z])([A-Z])/g, '$1 $2')));
    push(`${cells[0]} — ${cells[1]}. Stack: ${cells[2]}.`, 'Repositórios GitHub', '#repositorios');
  });

  return chunks;
}

/* ---------------------------------------------------------------- BM25 */

const STOP = new Set(
  'a o e de da do das dos em no na nos nas um uma para por com sem que se como ao aos à às ou mais seu sua seus suas voce você qual quais quando onde ja já tem ter foi ser sobre entre the and of to in for with on is are your you what how do does tem possui experiencia experiência'
    .split(' ')
    .map(normalize),
);

export function tokenize(text) {
  return normalize(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t && (t.length > 1 || /\d/.test(t)) && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith('s') ? t.slice(0, -1) : t));
}

export class BM25 {
  constructor(docs, { k1 = 1.2, b = 0.75 } = {}) {
    this.k1 = k1;
    this.b = b;
    this.docs = docs.map((d) => tokenize(d.text + ' ' + d.source));
    this.avgdl = this.docs.reduce((s, d) => s + d.length, 0) / Math.max(1, this.docs.length);
    this.df = new Map();
    this.docs.forEach((d) => new Set(d).forEach((t) => this.df.set(t, (this.df.get(t) || 0) + 1)));
  }

  idf(t) {
    const n = this.docs.length;
    const df = this.df.get(t) || 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  score(query) {
    const q = tokenize(query);
    return this.docs.map((doc) => {
      const tf = new Map();
      doc.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
      let s = 0;
      q.forEach((t) => {
        const f = tf.get(t);
        if (!f) return;
        s += this.idf(t) * ((f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * doc.length) / this.avgdl)));
      });
      return s;
    });
  }
}
