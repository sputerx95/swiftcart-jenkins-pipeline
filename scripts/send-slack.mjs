import fs from 'fs';

const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const pipelineResult = process.env.PIPELINE_RESULT || 'success';
const buildNumber = process.env.BUILD_NUMBER || 'local';
const buildUrl = process.env.BUILD_URL || '';
const baseUrl = process.env.BASE_URL || 'https://swiftcart-sanaev-dev.lovable.app';

if (!webhookUrl) {
  console.error('ERROR: SLACK_WEBHOOK_URL is not set');
  process.exit(1);
}

function readReportsUrl() {
  try {
    return fs.readFileSync('reports-url.txt', 'utf8').trim();
  } catch {
    return buildUrl;
  }
}

function buildSuccessText() {
  const reportsUrl = readReportsUrl();

  if (!fs.existsSync('reports/summary.json')) {
    return [
      `✅ Jenkins pipeline passed — build #${buildNumber}`,
      `Reports: ${reportsUrl}`,
      `Build: ${buildUrl}`
    ].join('\n');
  }

  const summary = JSON.parse(fs.readFileSync('reports/summary.json', 'utf8'));
  const checks = (summary.whatWeChecked || []).slice(0, 5).map((item) => `• ${item}`).join('\n');
  const passed = summary.overall?.passedChecks ?? '?';
  const total = summary.overall?.totalChecks ?? '?';
  const browsers = summary.overall?.browsersTested ?? '?';
  const plain = summary.plainSummary || 'All tests completed.';
  const siteUrl = summary.siteUrl || baseUrl;

  return [
    `✅ *SwiftCart quality check passed* — build #${buildNumber}`,
    plain,
    '',
    '*What we checked:*',
    checks,
    '',
    `*Passed:* ${passed} / ${total} · *Browsers tested:* ${browsers}`,
    '',
    `*Simple report:* ${reportsUrl}`,
    `*Jenkins build:* ${buildUrl}`,
    `*Website:* ${siteUrl}`
  ].join('\n');
}

function buildFailureText() {
  const reportsUrl = readReportsUrl();

  return [
    `❌ *SwiftCart pipeline failed* — build #${buildNumber}`,
    '',
    'Check Jenkins *Console Output* for the first red error above "Declarative: Post Actions".',
    '',
    `*Jenkins build:* ${buildUrl}`,
    `*Last report page:* ${reportsUrl}`
  ].join('\n');
}

const text = pipelineResult === 'success' ? buildSuccessText() : buildFailureText();
const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text })
});

const body = await response.text();
if (!response.ok) {
  console.error(`ERROR: Slack notification failed (HTTP ${response.status}): ${body}`);
  process.exit(1);
}

console.log(`Slack notification sent (HTTP ${response.status})`);
