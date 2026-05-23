pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        BASE_URL = 'https://swiftcart-sanaev-dev.lovable.app'
        CI = 'true'
        SLACK_ENABLED = 'false'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint --if-present'
            }
        }

        stage('Run Playwright Tests') {
            parallel {
                stage('Chromium') {
                    environment {
                        PLAYWRIGHT_HTML_REPORT = 'playwright-report/chromium'
                        JUNIT_OUTPUT = 'test-results/chromium/junit.xml'
                        TEST_RESULTS_DIR = 'test-results/chromium'
                    }
                    steps {
                        sh 'npm run test:chromium'
                    }
                }

                stage('Firefox') {
                    environment {
                        PLAYWRIGHT_HTML_REPORT = 'playwright-report/firefox'
                        JUNIT_OUTPUT = 'test-results/firefox/junit.xml'
                        TEST_RESULTS_DIR = 'test-results/firefox'
                    }
                    steps {
                        sh 'npm run test:firefox'
                    }
                }

                stage('WebKit') {
                    environment {
                        PLAYWRIGHT_HTML_REPORT = 'playwright-report/webkit'
                        JUNIT_OUTPUT = 'test-results/webkit/junit.xml'
                        TEST_RESULTS_DIR = 'test-results/webkit'
                    }
                    steps {
                        sh 'npm run test:webkit'
                    }
                }
            }
        }

        stage('Publish Reports') {
            steps {
                junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'

                archiveArtifacts artifacts: 'playwright-report/**, test-results/**',
                                 allowEmptyArchive: true,
                                 fingerprint: true

                publishHTML(target: [
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'playwright-report/chromium',
                    reportFiles: 'index.html',
                    reportName: 'Chromium Playwright Report'
                ])

                publishHTML(target: [
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'playwright-report/firefox',
                    reportFiles: 'index.html',
                    reportName: 'Firefox Playwright Report'
                ])

                publishHTML(target: [
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'playwright-report/webkit',
                    reportFiles: 'index.html',
                    reportName: 'WebKit Playwright Report'
                ])
            }
        }
    }

    post {
        success {
            echo "Pipeline passed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            script {
                if (env.SLACK_ENABLED == 'true') {
                    slackSend(
                        channel: '#qa-alerts',
                        color: 'good',
                        message: "✅ Passed: ${env.JOB_NAME} #${env.BUILD_NUMBER} - ${env.BUILD_URL}"
                    )
                }
            }
        }

        failure {
            echo "Pipeline failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            script {
                if (env.SLACK_ENABLED == 'true') {
                    slackSend(
                        channel: '#qa-alerts',
                        color: 'danger',
                        message: "❌ Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER} - ${env.BUILD_URL}"
                    )
                }
            }
        }

        always {
            cleanWs(cleanWhenNotBuilt: false,
                    deleteDirs: true,
                    disableDeferredWipeout: true,
                    notFailBuild: true)
        }
    }
}
