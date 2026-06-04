# SwiftCart Jenkins Pipeline

A portfolio-ready **Jenkins CI/CD** project for Playwright test automation against [SwiftCart](https://swiftcart-sanaev-dev.lovable.app).

- **CI** — checkout, lint, parallel cross-browser smoke tests, JUnit/HTML reporting inside Jenkins
- **CD** — deploy test reports to **GitHub Pages** (live dashboard + technical Playwright HTML per browser)
- **Notifications** — optional Slack pass/fail messages with report links

> This pipeline does **not** deploy the SwiftCart application. CD here means **continuous delivery of test report artifacts** to a public GitHub Pages site after each successful run.

---

## Live report (after a successful build)

```text
https://sputerx95.github.io/swiftcart-jenkins-pipeline/
```

The home page is a plain-language summary for non-technical readers. Technical Playwright reports are under `/chromium`, `/firefox`, and `/webkit`.

---

## What this project proves

- Jenkins pipeline-as-code with `Jenkinsfile`
- Playwright test execution in CI (Chromium, Firefox, WebKit in parallel)
- JUnit + HTML report publishing in Jenkins
- Build artifact archiving
- Plain-language summary report (`scripts/generate-summary.mjs`)
- **CD:** automated deploy of reports to GitHub Pages (`gh-pages` branch)
- Slack notifications via incoming webhook (`scripts/send-slack.mjs`)

---

## Tech stack

- Jenkins LTS (Docker)
- Playwright + TypeScript + Node.js
- HTML Publisher Plugin, JUnit Plugin
- GitHub Pages (`gh-pages`)
- Slack incoming webhook

---

## Architecture

```text
GitHub (main branch + Jenkinsfile)
   |
   v
Jenkins Pipeline
   |
   |-- Checkout
   |-- Install Dependencies (npm ci)
   |-- Lint
   |-- Run Playwright Tests (parallel)
   |      |-- Chromium
   |      |-- Firefox
   |      |-- WebKit
   |
   |-- Generate Summary Report
   |-- Publish Reports (JUnit + HTML in Jenkins)
   |
   |-- CD: Deploy Reports to GitHub Pages  -->  live report site
   |
   +-- Post: Slack notification (pass/fail)
```

---

## Local setup

### 1. Clone the repo

```bash
git clone https://github.com/sputerx95/swiftcart-jenkins-pipeline.git
cd swiftcart-jenkins-pipeline
```

### 2. Start Jenkins (Docker required)

```bash
docker compose up --build -d
```

First build of the Jenkins image can take 15–30 minutes (Playwright browsers + plugins). Later starts are fast:

```bash
docker compose up -d
```

Open Jenkins:

```text
http://localhost:8080
```

### 3. Initial Jenkins admin password (first run only)

```bash
docker exec swiftcart-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### 4. Create the pipeline job

1. **New Item** → name: `swiftcart-playwright-pipeline` → **Pipeline** → OK
2. **Pipeline** tab (left sidebar):
   - **Definition:** Pipeline script from SCM
   - **SCM:** Git
   - **Repository URL:** `https://github.com/sputerx95/swiftcart-jenkins-pipeline.git`
   - **Branch:** `*/main`
   - **Script Path:** `Jenkinsfile`
3. **Save** → **Build Now**

### 5. Jenkins credentials (required for full CI/CD)

**Manage Jenkins → Credentials → System → Global credentials → Add Credentials**

| Credential ID | Kind | Purpose |
|---------------|------|---------|
| `github-pages-token` | Username with password | GitHub username + **Personal Access Token** (`repo` scope) to push `gh-pages` |
| `slack-webhook-url` | Secret text | Slack incoming webhook URL |

Tests and lint run without credentials. **GitHub Pages deploy** and **Slack** fail until these are configured.

---

## Run tests locally (without Jenkins)

```bash
npm ci
npx playwright install
npm test                 # all browsers
npm run test:chromium    # single browser
npm run generate-summary
```

---

## Reports

### Inside Jenkins (after each build)

- JUnit test results
- Archived Playwright artifacts
- Chromium / Firefox / WebKit Playwright HTML reports (HTML Publisher plugin)

### GitHub Pages (CD — after successful deploy stage)

- **Summary dashboard** — `index.html` (plain English, browser cards, pass/fail counts)
- **Technical reports** — `/chromium`, `/firefox`, `/webkit`

---

## Slack notifications

Enabled by default in the `Jenkinsfile` (`SLACK_ENABLED = 'true'`).

To disable, set in `Jenkinsfile`:

```groovy
SLACK_ENABLED = 'false'
```

Requires Jenkins credential **`slack-webhook-url`**. Messages are sent from `scripts/send-slack.mjs` in the post-build `always` block. Slack failures do not fail the build.

---

## Project layout

```text
swiftcart-jenkins-pipeline/
├── Jenkinsfile                 # Pipeline definition (CI + CD + Slack)
├── docker-compose.yml          # Local Jenkins via Docker
├── Dockerfile.jenkins          # Jenkins + Node + Playwright browsers
├── playwright.config.ts
├── tests/smoke/                # Playwright smoke specs
├── scripts/
│   ├── generate-summary.mjs    # Plain-language HTML/JSON summary
│   └── send-slack.mjs          # Slack webhook notification
└── reports/                    # Generated at build time (gitignored)
```

---

## CI vs CD (how to explain it)

| Term | In this project |
|------|-----------------|
| **CI** | Integrate and validate code on every build: install, lint, test, publish results in Jenkins |
| **CD** | Deliver report artifacts to a live destination: push to `gh-pages` → GitHub Pages URL |

**Interview line:**

> I built a Jenkins CI/CD pipeline for Playwright test automation. CI runs lint and parallel cross-browser smoke tests. CD deploys HTML and summary reports to GitHub Pages so stakeholders get a live dashboard after each run, with Slack notifications on pass or fail.

---

## Resume bullet

- Built a Jenkins **CI/CD** pipeline for a Playwright TypeScript suite: parallel cross-browser smoke tests, JUnit/HTML reporting, **GitHub Pages report deployment**, plain-language summary dashboard, and Slack build notifications.
