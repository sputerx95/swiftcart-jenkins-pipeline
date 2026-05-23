# Setting Up Jenkins for Playwright Tests: A Complete CI/CD Guide for QA Engineers in 2026

## Intro

Most QA automation engineers use GitHub Actions because it is easy to start with. But many enterprise teams still use Jenkins, especially in banking, healthcare, insurance, logistics, and large internal engineering teams.

For this project, I built a Jenkins pipeline that runs Playwright tests against a SwiftCart demo application.

The goal was not only to run tests. The goal was to create a complete QA automation CI/CD workflow with reports, artifacts, parallel execution, and failure visibility.

## What the pipeline does

The Jenkins pipeline performs these steps:

1. Checks out the GitHub repository
2. Installs Node.js dependencies
3. Runs lint checks
4. Runs Playwright tests in parallel across Chromium, Firefox, and WebKit
5. Publishes HTML reports
6. Publishes JUnit test results
7. Archives Playwright artifacts
8. Supports Slack notifications

## Why Jenkins?

Jenkins is still widely used in enterprise environments because it is flexible, plugin-heavy, and works well with internal infrastructure.

For QA engineers, Jenkins knowledge is useful because many teams expect automation tests to run inside existing Jenkins pipelines.

## Project structure

```text
swiftcart-jenkins-pipeline/
├── Jenkinsfile
├── Dockerfile.jenkins
├── docker-compose.yml
├── plugins.txt
├── package.json
├── playwright.config.ts
└── tests/
```

## Jenkinsfile overview

The most important file is the `Jenkinsfile`. It defines the full pipeline as code.

Key stages:

- Checkout
- Install Dependencies
- Lint
- Run Playwright Tests
- Publish Reports

## Parallel browser execution

The pipeline runs tests across three browsers:

- Chromium
- Firefox
- WebKit

This helps catch browser-specific issues earlier.

## Reporting

The pipeline publishes:

- Playwright HTML reports
- JUnit XML results
- Screenshots, videos, and traces on failure

These artifacts make debugging easier because the tester does not need to guess what happened.

## What I learned

This project helped me understand how QA automation fits into CI/CD.

The biggest learning was that test automation is not only about writing tests. It is also about making those tests run reliably, report clearly, and provide fast feedback to the team.

## Final result

By the end, I had a Jenkins dashboard showing successful Playwright test runs, HTML reports, JUnit results, and archived artifacts.

This is the kind of setup QA teams use in real projects to protect releases and catch regressions before production.
