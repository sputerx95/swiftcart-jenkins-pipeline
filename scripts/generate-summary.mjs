import fs from 'fs';
import path from 'path';

const BROWSERS = [
  { id: 'chromium', label: 'Google Chrome', icon: '🌐' },
  { id: 'firefox', label: 'Mozilla Firefox', icon: '🦊' },
  { id: 'webkit', label: 'Safari', icon: '🧭' }
];

const FRIENDLY_CHECKS = {
  'home page loads successfully': 'Home page opens and shows content',
  'page has a valid title': 'Browser tab has a proper page title',
  'main page has at least one usable link or button': 'Main page has clickable links or buttons'
};

function friendlyCheckName(rawName) {
  const stripped = rawName.includes(' › ') ? rawName.split(' › ').pop() : rawName;
  return FRIENDLY_CHECKS[stripped] || stripped;
}

function parseJUnit(xml) {
  const cases = [];
  const caseRegex = /<testcase\b([^>]*)(?:\/>|>([\s\S]*?)<\/testcase>)/g;

  for (const match of xml.matchAll(caseRegex)) {
    const attrs = match[1];
    const body = match[2] || '';
    const name = attrs.match(/name="([^"]*)"/)?.[1] || 'Unknown check';
    const time = Number(attrs.match(/time="([^"]*)"/)?.[1] || 0);
    const failed = /<failure\b/.test(body) || /<error\b/.test(body);

    cases.push({
      rawName: name,
      name: friendlyCheckName(name),
      status: failed ? 'failed' : 'passed',
      timeSeconds: Math.round(time * 10) / 10
    });
  }

  const suiteFailures = Number(xml.match(/<testsuite\b[^>]*failures="(\d+)"/)?.[1] || 0);
  const failedCases = cases.filter((c) => c.status === 'failed').length;

  return {
    checks: cases,
    passed: cases.filter((c) => c.status === 'passed').length,
    failed: Math.max(suiteFailures, failedCases),
    total: cases.length
  };
}

function loadBrowserResults() {
  return BROWSERS.map((browser) => {
    const junitPath = path.join('test-results', browser.id, 'junit.xml');

    if (!fs.existsSync(junitPath)) {
      return {
        ...browser,
        status: 'missing',
        passed: 0,
        failed: 0,
        total: 0,
        checks: [],
        note: 'No results file found for this browser.'
      };
    }

    const parsed = parseJUnit(fs.readFileSync(junitPath, 'utf8'));
    return {
      ...browser,
      status: parsed.failed > 0 ? 'failed' : 'passed',
      passed: parsed.passed,
      failed: parsed.failed,
      total: parsed.total,
      checks: parsed.checks
    };
  });
}

function buildSummary() {
  const browsers = loadBrowserResults();
  const totalChecks = browsers.reduce((sum, b) => sum + b.total, 0);
  const passedChecks = browsers.reduce((sum, b) => sum + b.passed, 0);
  const failedChecks = browsers.reduce((sum, b) => sum + b.failed, 0);
  const missingBrowsers = browsers.filter((b) => b.status === 'missing').length;
  const failedBrowsers = browsers.filter((b) => b.status === 'failed').length;

  let status = 'passed';
  if (missingBrowsers > 0 || failedChecks > 0 || failedBrowsers > 0) {
    status = 'failed';
  }

  const browserLabels = browsers
    .filter((b) => b.status !== 'missing')
    .map((b) => b.label)
    .join(', ');

  const plainSummary =
    status === 'passed'
      ? `All ${passedChecks} checks passed on ${browserLabels || 'all browsers'}.`
      : `${failedChecks} of ${totalChecks} checks need attention across ${browserLabels || 'tested browsers'}.`;

  const uniqueChecks = [...new Set(browsers.flatMap((b) => b.checks.map((c) => c.name)))];

  return {
    status,
    generatedAt: new Date().toISOString(),
    buildNumber: process.env.BUILD_NUMBER || 'local',
    siteName: 'SwiftCart',
    siteUrl: process.env.BASE_URL || 'https://swiftcart-sanaev-dev.lovable.app',
    plainSummary,
    whatWeChecked: uniqueChecks,
    overall: {
      totalChecks,
      passedChecks,
      failedChecks,
      browsersTested: browsers.filter((b) => b.status !== 'missing').length
    },
    browsers
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderHtml(summary) {
  const statusLabel = summary.status === 'passed' ? 'All checks passed' : 'Some checks failed';
  const statusClass = summary.status === 'passed' ? 'ok' : 'bad';
  const generated = new Date(summary.generatedAt).toLocaleString();

  const browserCards = summary.browsers
    .map((browser) => {
      const cardClass = browser.status === 'passed' ? 'ok' : browser.status === 'failed' ? 'bad' : 'warn';
      const statusText =
        browser.status === 'passed'
          ? `${browser.passed}/${browser.total} passed`
          : browser.status === 'failed'
            ? `${browser.failed} failed`
            : 'No data';

      const checks = browser.checks
        .map(
          (check) => `
        <li class="${check.status}">
          <span class="mark">${check.status === 'passed' ? '✓' : '✕'}</span>
          <span>${escapeHtml(check.name)}</span>
        </li>`
        )
        .join('');

      return `
      <article class="card ${cardClass}">
        <header>
          <span class="icon">${browser.icon}</span>
          <div>
            <h3>${escapeHtml(browser.label)}</h3>
            <p>${escapeHtml(statusText)}</p>
          </div>
        </header>
        <ul>${checks || '<li class="warn"><span>No detailed results</span></li>'}</ul>
      </article>`;
    })
    .join('');

  const checklist = summary.whatWeChecked
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SwiftCart Test Summary — Build ${escapeHtml(summary.buildNumber)}</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #64748b;
      --ok: #16a34a;
      --bad: #dc2626;
      --warn: #d97706;
      --border: #e2e8f0;
      --accent: #2563eb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      background: linear-gradient(180deg, #eff6ff 0%, var(--bg) 220px);
      color: var(--text);
      line-height: 1.5;
    }
    .wrap { max-width: 980px; margin: 0 auto; padding: 32px 20px 48px; }
    .hero {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 12px;
    }
    .badge.ok { background: #dcfce7; color: #166534; }
    .badge.bad { background: #fee2e2; color: #991b1b; }
    h1 { margin: 0 0 8px; font-size: 2rem; }
    .lead { color: var(--muted); margin: 0 0 16px; font-size: 1.05rem; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .stat {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
    }
    .stat strong { display: block; font-size: 1.4rem; }
    .stat span { color: var(--muted); font-size: 0.9rem; }
    h2 { margin: 32px 0 12px; font-size: 1.25rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
    }
    .card header { display: flex; gap: 12px; align-items: center; margin-bottom: 10px; }
    .card h3 { margin: 0; font-size: 1rem; }
    .card header p { margin: 2px 0 0; color: var(--muted); font-size: 0.9rem; }
    .icon { font-size: 1.5rem; }
    .card ul { list-style: none; padding: 0; margin: 0; }
    .card li {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      padding: 8px 0;
      border-top: 1px solid var(--border);
      font-size: 0.95rem;
    }
    .card li:first-child { border-top: 0; }
    .mark { font-weight: 700; width: 1rem; }
    li.passed .mark { color: var(--ok); }
    li.failed .mark { color: var(--bad); }
    .panel {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px 20px;
    }
    .panel ul { margin: 0; padding-left: 20px; }
    .panel li { margin: 8px 0; }
    .links { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
    .btn {
      display: inline-block;
      padding: 10px 14px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      border: 1px solid var(--border);
      color: var(--text);
      background: #fff;
    }
    .btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    .footnote { margin-top: 20px; color: var(--muted); font-size: 0.85rem; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <span class="badge ${statusClass}">${statusLabel}</span>
      <h1>SwiftCart website quality check</h1>
      <p class="lead">${escapeHtml(summary.plainSummary)}</p>
      <p class="lead">We automatically opened your store in three major browsers to confirm customers can use it.</p>
      <div class="stats">
        <div class="stat"><strong>${summary.overall.passedChecks}</strong><span>Checks passed</span></div>
        <div class="stat"><strong>${summary.overall.totalChecks}</strong><span>Total checks</span></div>
        <div class="stat"><strong>${summary.overall.browsersTested}</strong><span>Browsers tested</span></div>
        <div class="stat"><strong>#${escapeHtml(summary.buildNumber)}</strong><span>Build number</span></div>
      </div>
    </section>

    <h2>Results by browser</h2>
    <section class="grid">${browserCards}</section>

    <h2>What we checked</h2>
    <section class="panel"><ul>${checklist}</ul></section>

    <div class="links">
      <a class="btn primary" href="${escapeHtml(summary.siteUrl)}" target="_blank" rel="noopener">Open SwiftCart website</a>
      <a class="btn" href="./chromium/index.html">Technical report (Chrome)</a>
      <a class="btn" href="./firefox/index.html">Technical report (Firefox)</a>
      <a class="btn" href="./webkit/index.html">Technical report (Safari)</a>
    </div>

    <p class="footnote">Generated ${escapeHtml(generated)} · <a href="${escapeHtml(summary.siteUrl)}" target="_blank" rel="noopener">${escapeHtml(summary.siteUrl)}</a></p>
  </section>
  </main>
</body>
</html>`;
}

const summary = buildSummary();
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync(path.join('reports', 'summary.json'), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join('reports', 'summary.html'), renderHtml(summary));

console.log(`Summary: ${summary.plainSummary}`);
console.log('Wrote reports/summary.json and reports/summary.html');
