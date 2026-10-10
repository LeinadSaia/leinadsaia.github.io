/**
 * ai-worker.js — Web Worker de embeddings (Transformers.js, ONNX Runtime Web).
 * Roda fora da thread principal para que a interface nunca trave durante a inferência.
 * Nenhum texto sai do navegador: apenas os pesos do modelo são baixados (e cacheados).
 */
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3';

env.allowLocalModels = false;

const MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
let extractor = null;

self.addEventListener('message', async ({ data }) => {
  const { id, type } = data;
  try {
    if (type === 'load') {
      if (!extractor) {
        extractor = await pipeline('feature-extraction', MODEL, {
          dtype: 'q8',
          progress_callback: (p) => self.postMessage({ type: 'progress', payload: p }),
        });
      }
      self.postMessage({ id, type: 'done', result: { model: MODEL } });
      return;
    }

    if (type === 'embed') {
      const output = await extractor(data.texts, { pooling: 'mean', normalize: true });
      self.postMessage({ id, type: 'done', result: output.tolist() });
    }
  } catch (err) {
    self.postMessage({ id, type: 'error', error: String(err?.message || err) });
  }
});
