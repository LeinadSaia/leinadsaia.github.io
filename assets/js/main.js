import { getCorpusText } from './corpus.js';

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

const init = () => {
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

  // 6. Tabs (Competências)
  const tablist = document.querySelector('.tablist');
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');

  if (tablist) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.setAttribute('aria-selected', 'false');
          t.setAttribute('tabindex', '-1');
        });
        panels.forEach(p => p.hidden = true);
        
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
        const panelId = tab.getAttribute('aria-controls');
        const panel = document.getElementById(panelId);
        if (panel) panel.hidden = false;
      });
    });
  }

  // Scrollspy para o Sumário
  const navLinks = document.querySelectorAll('.nav a');
  const sections = document.querySelectorAll('.section');

  const scrollSpyObserver = new IntersectionObserver((entries) => {
    let activeSection = null;
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeSection = entry.target.id;
      }
    });

    if (activeSection) {
      navLinks.forEach(link => {
        link.removeAttribute('aria-current');
        if (link.getAttribute('href') === `#${activeSection}`) {
          link.setAttribute('aria-current', 'true');
        }
      });
    }
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(sec => scrollSpyObserver.observe(sec));

  // Smooth scroll click handler for Nav
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').slice(1);
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
        history.pushState(null, null, `#${targetId}`);
      }
    });
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
  // 8. Fetch GitHub Repositories
  async function loadGitHubRepos() {
    const container = document.getElementById('gh-repos');
    if (!container) return;
    try {
      const res = await fetch('https://api.github.com/users/LeinadSaia/repos?type=public&sort=updated&per_page=6');
      if (!res.ok) throw new Error('API Error');
      const repos = await res.json();
      container.innerHTML = repos.filter(r => !r.fork).map(repo => `
        <a class="repo-card" href="${repo.html_url}" target="_blank" rel="noopener">
          <div class="repo-top">
            <h3>${repo.name}</h3>
            ${repo.language ? `<span class="lang-dot ${repo.language.toLowerCase()}"></span><span class="lang">${repo.language}</span>` : ''}
          </div>
          <p>${repo.description || 'Repositório público (sem descrição).'}</p>
          <div class="repo-stats">
            <span><svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg> ${repo.stargazers_count}</span>
            <span><svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg> ${repo.forks_count}</span>
          </div>
        </a>
      `).join('');
    } catch (err) {
      container.innerHTML = '<p style="color: var(--bad); grid-column: 1/-1;">Não foi possível carregar os repositórios no momento. Verifique minha conta no GitHub.</p>';
    }
  }

  loadGitHubRepos();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
