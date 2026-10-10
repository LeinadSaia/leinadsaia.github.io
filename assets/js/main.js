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
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
