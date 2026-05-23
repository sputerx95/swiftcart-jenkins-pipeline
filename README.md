# SwiftCart Jenkins Pipeline

A portfolio-ready Jenkins CI/CD project that runs Playwright tests against SwiftCart, publishes HTML reports, archives test artifacts, and supports Slack notifications.

## What this project proves

- Jenkins pipeline-as-code with `Jenkinsfile`
- Playwright test execution in CI
- Parallel browser testing across Chromium, Firefox, and WebKit
- HTML report publishing in Jenkins
- JUnit test result publishing
- Build artifact archiving
- Optional Slack notifications

## Tech stack

- Jenkins LTS
- Docker
- Playwright
- TypeScript
- Node.js
- HTML Publisher Plugin
- JUnit reports
- Slack plugin

## Architecture

```text
GitHub Repo
   |
   v
Jenkins Pipeline
   |
   |-- Install Dependencies
   |-- Lint
   |-- Parallel Playwright Tests
   |      |-- Chromium
   |      |-- Firefox
   |      |-- WebKit
   |
   |-- Publish HTML Reports
   |-- Archive Artifacts
   |-- Optional Slack Notification
```

## Local setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd swiftcart-jenkins-pipeline
```

### 2. Start Jenkins

```bash
docker compose up --build -d
```

Open Jenkins:

```text
http://localhost:8080
```

### 3. Get the initial Jenkins admin password

```bash
docker exec swiftcart-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### 4. Create a Jenkins Pipeline job

1. Click **New Item**
2. Name it `swiftcart-playwright-pipeline`
3. Choose **Pipeline**
4. Under **Pipeline**, choose **Pipeline script from SCM**
5. SCM: **Git**
6. Repository URL: your GitHub repo URL
7. Branch: `main`
8. Script Path: `Jenkinsfile`
9. Save
10. Click **Build Now**

## Run tests locally without Jenkins

```bash
npm ci
npx playwright install
npm test
```

## Jenkins reports

After the build finishes, Jenkins will show:

- JUnit test results
- Archived Playwright artifacts
- Chromium Playwright Report
- Firefox Playwright Report
- WebKit Playwright Report

## Slack notification

Slack is disabled by default.

To enable it:

1. Configure the Jenkins Slack plugin.
2. Add the Slack credential/workspace settings in Jenkins.
3. Change this in the `Jenkinsfile`:

```groovy
SLACK_ENABLED = 'true'
```

## Interview explanation

> I built a Jenkins CI/CD pipeline for a Playwright automation suite. The pipeline checks out the code, installs dependencies, runs linting, executes tests in parallel across Chromium, Firefox, and WebKit, publishes HTML reports, archives artifacts, and has optional Slack notifications for build status. This gave me hands-on experience with Jenkins pipeline-as-code, CI reporting, test artifacts, and cross-browser automation in an enterprise-style workflow.

## Resume bullet

- Built a Jenkins CI/CD pipeline for a Playwright TypeScript automation suite, running parallel cross-browser tests, publishing HTML/JUnit reports, archiving artifacts, and supporting Slack build notifications.
