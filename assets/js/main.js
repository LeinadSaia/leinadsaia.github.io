import { getCorpusText } from './corpus.js';
import { auditCorpus, computeMatch, termOrigin } from './ats-core.js';
import { semantic, splitRequirements, simBand } from './semantic.js';
import { initTerminal } from './terminal.js';

const SAMPLE_JOB = `Analista de Sistemas / SRE Pleno (Remoto)

Requisitos:
- Experiência sólida em Administração Linux (Ubuntu/Debian) e tuning de SO.
- Conhecimentos em infraestrutura de nuvem e ferramentas de IaC (Terraform, Ansible).
- Vivência avançada com monitoramento, utilizando Prometheus e Grafana.
- Experiência em CI/CD e esteiras automatizadas (GitLab CI, GitHub Actions).
- Prática na definição de SLOs, SLIs e acompanhamento de Error Budgets.
- Familiaridade com PostgreSQL (troubleshooting, backups e replicação).
- Capacidade de analisar causa raiz e conduzir Post-Mortems de incidentes sem culpa.
- Experiência com containers Docker e noções de orquestração Kubernetes.
- Desejável experiência com modelos de IA locais (Ollama, vLLM) e AIOps.`;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Clock Updates (Status)
  const clockEl = document.getElementById('clock');
  if (clockEl) {
    const updateClock = () => {
      const d = new Date();
      const time = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      clockEl.textContent = `${time} BRT`;
      clockEl.setAttribute('datetime', d.toISOString());
    };
    updateClock();
    setInterval(updateClock, 60000); // update every minute
  }

  // 2. Intersection Observer for Scroll Animations (.reveal & .kpis)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Se for um item de KPI com barra, animamos também
        const bars = entry.target.querySelectorAll('.bar');
        bars.forEach(b => b.parentElement.classList.add('is-visible'));
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // 3. Terminal Initialization
  initTerminal({
    onScrollTo: (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        el.focus({ preventScroll: true });
      }
    }
  });

  // 3. Auditor ATS Base (Pre-calculation)
  const corpusText = getCorpusText();
  const audit = auditCorpus(corpusText);
  
  const elAuditScore = document.getElementById('audit-score');
  const elAuditCount = document.getElementById('audit-count');
  const elAuditChips = document.getElementById('audit-chips');
  
  if (elAuditScore && elAuditCount && elAuditChips) {
    elAuditScore.textContent = audit.score + '%';
    elAuditCount.textContent = `${audit.hits.length} de ${audit.total} termos`;
    
    // Sort hits so canonical ones appear first, then AI ones
    const sortedHits = [...audit.hits].sort((a, b) => {
      const oA = termOrigin(a);
      const oB = termOrigin(b);
      if (oA === oB) return a.localeCompare(b);
      return oA === 'canonical' ? -1 : 1;
    });

    sortedHits.forEach(term => {
      const span = document.createElement('span');
      const origin = termOrigin(term);
      span.className = origin === 'ai' ? 'chip ai' : 'chip ok';
      span.textContent = term;
      elAuditChips.appendChild(span);
    });

    audit.missing.forEach(term => {
      const span = document.createElement('span');
      span.className = 'chip off';
      span.textContent = term;
      elAuditChips.appendChild(span);
    });
  }

  // 4. Matcher Logic
  const btnMatch = document.getElementById('btn-match');
  const btnSample = document.getElementById('btn-sample');
  const btnClear = document.getElementById('btn-clear');
  const inputJob = document.getElementById('job-input');
  const matchResult = document.getElementById('match-result');
  
  const runMatch = () => {
    const text = inputJob.value.trim();
    if (!text) {
      matchResult.hidden = true;
      return;
    }
    
    // Compute classical lexical match
    const res = computeMatch(text, corpusText);
    
    // Update basic stats
    document.getElementById('r-req').textContent = res.jobTerms.length;
    document.getElementById('r-hit').textContent = res.hits.length;
    document.getElementById('r-bonus').textContent = `+${res.bonus}`;
    
    let calcStr = `( ${res.hits.length} ÷ ${Math.max(1, res.jobTerms.length)} ) × 100`;
    if (res.bonus > 0) calcStr += ` + ${res.bonus} bônus`;
    document.getElementById('r-calc').textContent = `= ${res.score}%`;
    
    // Update visual gauge
    document.getElementById('gauge-val').textContent = res.score;
    const fill = document.getElementById('gauge-fill');
    if (fill) {
      // 326.73 is the circumference for r=52 (2 * pi * 52)
      const offset = 326.73 - (326.73 * (res.score / 100));
      // Give a tiny delay for CSS transition to trigger if it was just unhidden
      setTimeout(() => {
        fill.style.strokeDashoffset = Math.max(0, offset);
      }, 50);
    }
    
    // Update chip lists
    const renderChips = (containerId, terms, isMiss) => {
      const c = document.getElementById(containerId);
      if (!c) return;
      c.innerHTML = '';
      if (!terms.length) {
        c.innerHTML = '<span class="dim" style="font-size:12px;display:block;margin-top:4px">Nenhum</span>';
        return;
      }
      terms.forEach(t => {
        const span = document.createElement('span');
        if (isMiss) span.className = 'chip bad';
        else span.className = termOrigin(t) === 'ai' ? 'chip ai' : 'chip ok';
        span.textContent = t;
        c.appendChild(span);
      });
    };
    
    renderChips('r-hits', res.hits, false);
    renderChips('r-miss', res.miss, true);
    
    matchResult.hidden = false;

    // Run semantic match if the engine is ready
    if (semantic.ready) {
      runSemanticMatch(text);
    }
  };

  btnMatch?.addEventListener('click', runMatch);
  
  inputJob?.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      runMatch();
    }
  });
  
  btnSample?.addEventListener('click', () => {
    inputJob.value = SAMPLE_JOB;
    runMatch();
  });
  
  btnClear?.addEventListener('click', () => {
    inputJob.value = '';
    matchResult.hidden = true;
    document.getElementById('sem-results').innerHTML = '';
    inputJob.focus();
  });

  // 5. Semantic Layer Integration
  const btnSemantic = document.getElementById('btn-semantic');
  const semProgress = document.getElementById('sem-progress');
  const semStatus = document.getElementById('sem-status');
  const semResults = document.getElementById('sem-results');
  const semanticSection = document.getElementById('semantic');
  
  const runSemanticMatch = async (text) => {
    if (!semResults) return;
    semResults.innerHTML = '<p class="dim" style="margin-top:10px">Analisando contexto através de inferência local...</p>';
    
    const reqs = splitRequirements(text);
    if (!reqs.length) {
      semResults.innerHTML = '<p class="dim" style="margin-top:10px">Nenhum requisito longo e claro identificado para análise semântica.</p>';
      return;
    }
    
    try {
      const matches = await semantic.matchRequirements(reqs);
      semResults.innerHTML = '';
      
      const table = document.createElement('table');
      table.className = 'sem-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th scope="col">Requisito Interpretado</th>
            <th scope="col">Grau de Aderência (Similaridade)</th>
            <th scope="col">Melhor Evidência (Dossiê)</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      
      const tbody = table.querySelector('tbody');
      
      matches.forEach(m => {
        const band = simBand(m.score);
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
          <td>${m.requirement}</td>
          <td>
            <div class="sim ${band.cls}">
              <i style="--s: ${(m.score * 100).toFixed(1)}%"></i>
              ${(m.score * 100).toFixed(0)}% — ${band.label}
            </div>
          </td>
          <td>
            ${m.evidence.text}
            <span class="src">Seção ${m.evidence.section}</span>
          </td>
        `;
        tbody.appendChild(tr);
      });
      
      semResults.appendChild(table);
    } catch (err) {
      console.error(err);
      semResults.innerHTML = `<p class="dim" style="color:var(--bad);margin-top:10px">Falha durante a inferência semântica: ${err.message}</p>`;
    }
  };
  
  btnSemantic?.addEventListener('click', async () => {
    btnSemantic.hidden = true;
    semProgress.hidden = false;
    semStatus.textContent = 'Iniciando engine ONNX em background worker...';
    
    try {
      await semantic.load((info) => {
        semStatus.textContent = info.text;
        const bar = semProgress.querySelector('span');
        if (bar) bar.style.width = (info.pct * 100) + '%';
      });
      
      semProgress.hidden = true;
      semStatus.innerHTML = 'IA ativada. <strong>Transformers.js</strong> operando localmente no navegador.';
      semanticSection.classList.add('is-ready');
      
      if (inputJob.value.trim() && !matchResult.hidden) {
        runSemanticMatch(inputJob.value);
      }
    } catch (e) {
      semProgress.hidden = true;
      semStatus.textContent = 'Falha ao iniciar IA. ' + e.message;
      btnSemantic.hidden = false;
    }
  });

  // 6. Plain Text Exporter Utils
  const copyPlain = document.getElementById('copy-plain');
  copyPlain?.addEventListener('click', async () => {
    try {
      const resp = await fetch('resume-plain.txt');
      const text = await resp.text();
      await navigator.clipboard.writeText(text);
      
      const orig = copyPlain.innerHTML;
      copyPlain.textContent = 'Texto copiado!';
      setTimeout(() => copyPlain.innerHTML = orig, 2000);
    } catch (e) {
      console.error('Copy failed', e);
      alert('Falha ao copiar o texto. Tente baixar o arquivo.');
    }
  });

  const plainDetails = document.getElementById('plain-details');
  const plainPre = document.getElementById('plain-pre');
  let plainLoaded = false;
  
  plainDetails?.addEventListener('toggle', async () => {
    if (plainDetails.open && !plainLoaded && plainPre) {
      plainPre.textContent = 'Carregando versão plain text...';
      try {
        const resp = await fetch('resume-plain.txt');
        if (resp.ok) {
          plainPre.textContent = await resp.text();
          plainLoaded = true;
        } else {
          plainPre.textContent = 'Não foi possível carregar o conteúdo (HTTP ' + resp.status + ').';
        }
      } catch (e) {
        plainPre.textContent = 'Erro de rede ao tentar carregar preview.';
      }
    }
  });

  // 7. Toast Notifier helper (optional/global)
  window.showToast = function(msg, isError = false) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    if (isError) t.style.background = 'var(--bad)';
    else t.style.background = 'var(--ink)';
    t.classList.add('show');
    setTimeout(() => {
      t.classList.remove('show');
    }, 3000);
  };
});
