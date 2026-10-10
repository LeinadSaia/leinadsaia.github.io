/**
 * ats-core.js — Motor de auditoria ATS (módulo compartilhado navegador + CI)
 *
 * Implementa as seções 5.1 e 5.2 do Plano Estrutural:
 *   - Dicionário de keywords canônicas (lista literal do plano)
 *   - Extensão de IA aplicada a operações (seção 5.1.1)
 *   - Léxico estendido usado APENAS para extrair requisitos da vaga,
 *     evitando que tecnologias fora do dicionário inflem o Match Ratio
 *   - Match Ratio = min(100, (identificados / max(1, requisitos)) * 100 + bônus)
 *
 * Sem dependências. Funciona em navegadores modernos e Node >= 18.
 */

/** 5.1 — Dicionário canônico (literal, não editar a ordem). */
export const CANONICAL_KEYWORDS = [
  'linux', 'sre', 'site reliability engineering', 'sysadmin', 'system administrator',
  'analista de sistemas', 'ansible', 'terraform', 'bash', 'shell script', 'python',
  'prometheus', 'grafana', 'observability', 'observabilidade', 'sli', 'slo', 'sla',
  'error budget', 'post-mortem', 'postgresql', 'mysql', 'redis', 'nginx', 'haproxy',
  'docker', 'kubernetes', 'aws', 'cloud', 'ci/cd', 'github actions', 'hardening',
  'selinux', 'nftables', 'iptables', 'lvm', 'zfs', 'disaster recovery', 'drp',
  'incident management', 'tuning', 'troubleshooting', 'itil', 'monitoring', 'high availability',
];

/** 5.1.1 — Extensão: IA aplicada a operações. */
export const AI_KEYWORDS = [
  'ia', 'inteligencia artificial', 'artificial intelligence', 'llm', 'llmops', 'mlops',
  'aiops', 'ollama', 'vllm', 'open webui', 'gpu', 'cuda', 'nvidia', 'inferencia',
  'agentes de ia', 'copilot', 'chatops', 'deteccao de anomalias', 'machine learning',
];

/** 5.2 — Termos estruturantes que concedem o Bônus de Sênior. */
export const SENIOR_TERMS = ['disaster recovery', 'error budget', 'tuning', 'hardening'];
export const SENIOR_BONUS = 5;

/**
 * Léxico estendido — tecnologias de mercado que NÃO estão no dicionário.
 * Servem para reconhecer requisitos da vaga e expor lacunas reais.
 */
export const EXTENDED_LEXICON = [
  'azure', 'gcp', 'google cloud', 'openshift', 'vmware', 'proxmox', 'kvm', 'windows server',
  'active directory', 'jenkins', 'gitlab ci', 'argocd', 'helm', 'istio', 'linkerd', 'envoy',
  'traefik', 'zabbix', 'datadog', 'new relic', 'splunk', 'dynatrace', 'elk', 'elasticsearch',
  'loki', 'opentelemetry', 'jaeger', 'pagerduty', 'opsgenie', 'kafka', 'rabbitmq', 'mongodb',
  'oracle', 'sql server', 'mariadb', 'patroni', 'pgbouncer', 'etcd', 'vault', 'consul',
  'packer', 'puppet', 'chef', 'saltstack', 'pulumi', 'opentofu', 'cloudformation', 'powershell',
  'golang', 'rust', 'java', 'node.js', 'javascript', 'typescript', 'git', 'devops', 'devsecops',
  'finops', 'sonarqube', 'trivy', 'k6', 'locust', 'chaos engineering', 'wireguard', 'openvpn',
  'ipsec', 'dns', 'tcp/ip', 'bgp', 'ldap', 'keycloak', 'apparmor', 'fail2ban', 'cis benchmarks',
  'iso 27001', 'lgpd', 'cmdb', 'uml', 'rto', 'rpo', 'rhcsa', 'lpic', 'ceph', 'nfs', 'iscsi',
  'ec2', 'rds', 'vpc', 'eks', 'gke', 'aks', 'podman', 'systemd', 'cgroups', 'ebpf', 'strace',
  'tcpdump', 'scrum', 'kanban', 'docker compose', 'restic', 'wal-g', 'pgbackrest',
];

/** Variações aceitas para cada termo (todas já normalizadas: minúsculas, sem acento). */
export const ALIASES = {
  'kubernetes': ['kubernetes', 'k8s'],
  'postgresql': ['postgresql', 'postgres'],
  'post-mortem': ['post-mortem', 'post-mortems', 'postmortem', 'postmortems', 'post mortem'],
  'ci/cd': ['ci/cd', 'ci-cd', 'cicd', 'ci / cd', 'integracao continua'],
  'shell script': ['shell script', 'shell scripting', 'shell scripts'],
  'incident management': ['incident management', 'gestao de incidentes', 'gerenciamento de incidentes', 'resposta a incidentes'],
  'monitoring': ['monitoring', 'monitoramento'],
  'high availability': ['high availability', 'alta disponibilidade'],
  'disaster recovery': ['disaster recovery', 'recuperacao de desastres'],
  'cloud': ['cloud', 'nuvem'],
  'error budget': ['error budget', 'error budgets', 'orcamento de erro', 'orcamentos de erro'],
  'system administrator': ['system administrator', 'administrador de sistemas'],
  'sysadmin': ['sysadmin', 'sys admin'],
  'sli': ['sli', 'slis'],
  'slo': ['slo', 'slos'],
  'sla': ['sla', 'slas'],
  'itil': ['itil', 'itil v4'],
  'ia': ['ia', 'i.a.'],
  'inteligencia artificial': ['inteligencia artificial'],
  'llm': ['llm', 'llms'],
  'gpu': ['gpu', 'gpus'],
  'inferencia': ['inferencia', 'inference'],
  'agentes de ia': ['agentes de ia', 'agente de ia', 'ai agents', 'ai agent', 'agentes de inteligencia artificial'],
  'copilot': ['copilot', 'github copilot'],
  'deteccao de anomalias': ['deteccao de anomalias', 'anomaly detection'],
  'gitlab ci': ['gitlab ci', 'gitlab ci/cd', 'gitlab'],
  'argocd': ['argocd', 'argo cd'],
  'golang': ['golang'],
  'node.js': ['node.js', 'nodejs'],
  'elk': ['elk', 'elk stack'],
  'opentelemetry': ['opentelemetry', 'otel'],
  'cis benchmarks': ['cis benchmarks', 'cis benchmark'],
  'tcp/ip': ['tcp/ip'],
  'chaos engineering': ['chaos engineering', 'engenharia do caos'],
  'docker compose': ['docker compose', 'docker-compose'],
};

/** Normaliza texto: minúsculas, remove diacríticos, padroniza traços e espaços. */
export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\s+/g, ' ');
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const patternCache = new Map();

/** Regex com fronteira de palavra Unicode (evita "sla" casar com "slack"). */
function patternFor(term) {
  if (patternCache.has(term)) return patternCache.get(term);
  const variants = (ALIASES[term] || [term]).map((v) => escapeRe(normalize(v)));
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${variants.join('|')})(?![\\p{L}\\p{N}])`, 'u');
  patternCache.set(term, re);
  return re;
}

/** Retorna os termos do vocabulário presentes no texto (já normalizado ou não). */
export function findTerms(text, vocabulary) {
  const norm = normalize(text);
  return vocabulary.filter((term) => patternFor(term).test(norm));
}

export const ALL_TERMS = [...new Set([...CANONICAL_KEYWORDS, ...AI_KEYWORDS, ...EXTENDED_LEXICON])];

/** Classifica um termo pela origem, para exibição. */
export function termOrigin(term) {
  if (CANONICAL_KEYWORDS.includes(term)) return 'canonical';
  if (AI_KEYWORDS.includes(term)) return 'ai';
  return 'extended';
}

/**
 * 5.2 — Job Matcher.
 * @param {string} jobText    Texto colado pelo recrutador
 * @param {string} corpusText Texto integral do dossiê
 */
export function computeMatch(jobText, corpusText) {
  const requirements = findTerms(jobText, ALL_TERMS);
  const corpusHits = new Set(findTerms(corpusText, requirements));
  const identified = requirements.filter((t) => corpusHits.has(t));
  const missing = requirements.filter((t) => !corpusHits.has(t));
  const seniorProven = SENIOR_TERMS.filter((t) => identified.includes(t));
  const bonus = requirements.length > 0 && seniorProven.length > 0 ? SENIOR_BONUS : 0;
  const base = (identified.length / Math.max(1, requirements.length)) * 100;
  const ratio = requirements.length === 0 ? 0 : Math.min(100, base + bonus);

  return {
    ratio: Math.round(ratio * 10) / 10,
    base: Math.round(base * 10) / 10,
    bonus,
    seniorProven,
    requirements,
    identified,
    missing,
  };
}

/** Auditoria do próprio dossiê contra o dicionário canônico + extensão IA. */
export function auditCorpus(corpusText) {
  const vocab = [...CANONICAL_KEYWORDS, ...AI_KEYWORDS];
  const present = new Set(findTerms(corpusText, vocab));
  return vocab.map((term) => ({ term, origin: termOrigin(term), present: present.has(term) }));
}
