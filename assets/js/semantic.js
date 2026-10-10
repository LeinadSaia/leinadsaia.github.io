/**
 * semantic.js — Fachada da camada semântica (IA no navegador).
 * Gerencia o worker, o progresso de download, o índice vetorial do dossiê
 * e as consultas por similaridade de cosseno.
 */
import { getChunks } from './corpus.js';

const state = {
  worker: null,
  ready: false,
  loading: null,
  chunks: [],
  vectors: [],
  seq: 0,
  pending: new Map(),
};

function call(type, payload = {}) {
  return new Promise((resolve, reject) => {
    const id = ++state.seq;
    state.pending.set(id, { resolve, reject });
    state.worker.postMessage({ id, type, ...payload });
  });
}

const dot = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

export const semantic = {
  get ready() {
    return state.ready;
  },

  /**
   * Baixa o modelo e indexa as evidências do dossiê.
   * @param {(info:{phase:string, pct:number, text:string}) => void} onProgress
   */
  load(onProgress = () => {}) {
    if (state.loading) return state.loading;

    state.loading = (async () => {
      state.worker = new Worker(new URL('./ai-worker.js', import.meta.url), { type: 'module' });
      const files = new Map();

      state.worker.addEventListener('message', ({ data }) => {
        if (data.type === 'progress') {
          const p = data.payload;
          if (p.status === 'progress' && p.total) {
            files.set(p.file, { loaded: p.loaded, total: p.total });
            let loaded = 0;
            let total = 0;
            files.forEach((f) => { loaded += f.loaded; total += f.total; });
            const mb = (n) => (n / 1048576).toFixed(1);
            onProgress({ phase: 'download', pct: (loaded / total) * 0.85, text: `baixando modelo · ${mb(loaded)} / ${mb(total)} MB` });
          }
          return;
        }
        const job = state.pending.get(data.id);
        if (!job) return;
        state.pending.delete(data.id);
        data.type === 'error' ? job.reject(new Error(data.error)) : job.resolve(data.result);
      });

      state.worker.addEventListener('error', (e) => {
        state.pending.forEach((job) => job.reject(new Error(e.message || 'Falha no worker')));
        state.pending.clear();
      });

      onProgress({ phase: 'download', pct: 0.02, text: 'inicializando runtime ONNX (WebAssembly)…' });
      await call('load');

      state.chunks = getChunks();
      const batch = 12;
      state.vectors = [];
      for (let i = 0; i < state.chunks.length; i += batch) {
        const slice = state.chunks.slice(i, i + batch).map((c) => c.text);
        const vecs = await call('embed', { texts: slice });
        state.vectors.push(...vecs);
        const done = Math.min(i + batch, state.chunks.length);
        onProgress({ phase: 'index', pct: 0.85 + 0.15 * (done / state.chunks.length), text: `indexando evidências · ${done}/${state.chunks.length}` });
      }

      state.ready = true;
      onProgress({ phase: 'ready', pct: 1, text: `pronto · ${state.chunks.length} evidências indexadas localmente` });
      window.dispatchEvent(new CustomEvent('semantic:ready'));
    })().catch((err) => {
      state.loading = null;
      state.worker?.terminate();
      throw err;
    });

    return state.loading;
  },

  async embed(texts) {
    if (!state.ready) throw new Error('Camada semântica não carregada');
    return call('embed', { texts });
  },

  /** Top-k evidências para uma consulta em linguagem natural. */
  async search(query, k = 3) {
    const [q] = await this.embed([query]);
    return state.vectors
      .map((v, i) => ({ ...state.chunks[i], score: dot(q, v) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  },

  /** Para cada requisito, a melhor evidência do dossiê. */
  async matchRequirements(requirements) {
    if (!requirements.length) return [];
    const qv = await this.embed(requirements);
    return requirements.map((req, i) => {
      let best = -1;
      let bestIdx = 0;
      state.vectors.forEach((v, j) => {
        const s = dot(qv[i], v);
        if (s > best) { best = s; bestIdx = j; }
      });
      return { requirement: req, evidence: state.chunks[bestIdx], score: best };
    });
  },
};

/** Quebra a descrição de vaga em requisitos individuais. */
export function splitRequirements(text) {
  return String(text || '')
    .split(/\n|(?<=[.;])\s+/)
    .map((l) => l.replace(/^[\s\-–—•*·>\d.)]+/, '').trim())
    .filter((l) => l.length >= 12 && l.split(/\s+/).length >= 2)
    .filter((l) => !(/:$/.test(l) && l.split(/\s+/).length <= 4))
    .slice(0, 30);
}

/** Faixas heurísticas calibradas para paraphrase-multilingual-MiniLM. */
export function simBand(score) {
  if (score >= 0.5) return { cls: 'hi', label: 'atendido' };
  if (score >= 0.38) return { cls: 'mid', label: 'parcial' };
  return { cls: 'lo', label: 'lacuna' };
}
