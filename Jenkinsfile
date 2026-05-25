pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        BASE_URL = 'https://swiftcart-sanaev-dev.lovable.app'
        CI = 'true'
        SLACK_ENABLED = 'true'
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
                    }
                    steps {
                        sh 'npm run test:chromium'
                    }
                }

                stage('Firefox') {
                    environment {
                        PLAYWRIGHT_HTML_REPORT = 'playwright-report/firefox'
                        JUNIT_OUTPUT = 'test-results/firefox/junit.xml'
                    }
                    steps {
                        sh 'npm run test:firefox'
                    }
                }

                stage('WebKit') {
                    environment {
                        PLAYWRIGHT_HTML_REPORT = 'playwright-report/webkit'
                        JUNIT_OUTPUT = 'test-results/webkit/junit.xml'
                    }
                    steps {
                        sh 'npm run test:webkit'
                    }
                }
            }
        }

        stage('Generate Summary Report') {
            steps {
                sh 'node scripts/generate-summary.mjs'
                archiveArtifacts artifacts: 'reports/summary.*',
                                 allowEmptyArchive: true,
                                 fingerprint: true
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

        stage('CD: Deploy Reports to GitHub Pages') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-pages-token',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_TOKEN'
                )]) {
                    sh '''
                        set +x
                        set -e

                        GITHUB_REPO_URL="$(git config --get remote.origin.url)"
                        REPO_PATH="$(echo "$GITHUB_REPO_URL" | sed -E 's#https://github.com/##; s#git@github.com:##; s#\\.git$##')"

                        OWNER="$(echo "$REPO_PATH" | cut -d/ -f1)"
                        REPO="$(echo "$REPO_PATH" | cut -d/ -f2)"
                        PAGES_URL="https://${OWNER}.github.io/${REPO}/"

                        echo "$PAGES_URL" > reports-url.txt

                        rm -rf gh-pages

                        git clone --depth 1 --branch gh-pages "https://${GIT_USER}:${GIT_TOKEN}@github.com/${REPO_PATH}.git" gh-pages >/dev/null 2>&1 || true

                        if [ ! -d gh-pages/.git ]; then
                            mkdir gh-pages
                            cd gh-pages
                            git init >/dev/null
                            git checkout -b gh-pages >/dev/null
                            git remote add origin "https://${GIT_USER}:${GIT_TOKEN}@github.com/${REPO_PATH}.git"
                            cd ..
                        fi

                        find gh-pages -mindepth 1 -maxdepth 1 ! -name ".git" -exec rm -rf {} +

                        mkdir -p gh-pages/chromium gh-pages/firefox gh-pages/webkit

                        copy_report_dir() {
                            src="$1"
                            dest="$2"
                            mkdir -p "$dest"
                            if [ -d "$src" ] && [ -n "$(ls -A "$src" 2>/dev/null)" ]; then
                                cp -R "$src/." "$dest/"
                            else
                                echo "No Playwright HTML files in $src (skipped copy)."
                            fi
                        }

                        copy_report_dir playwright-report/chromium gh-pages/chromium
                        copy_report_dir playwright-report/firefox gh-pages/firefox
                        copy_report_dir playwright-report/webkit gh-pages/webkit

                        node scripts/generate-summary.mjs

                        if [ ! -f reports/summary.html ]; then
                            echo "ERROR: reports/summary.html was not created."
                            exit 1
                        fi

                        cp reports/summary.html gh-pages/index.html

                        touch gh-pages/.nojekyll

                        cd gh-pages

                        git config user.email "jenkins@local.dev"
                        git config user.name "Jenkins CI"

                        git add .

                        if git diff --cached --quiet; then
                            echo "No report changes to commit."
                        else
                            git commit -m "Deploy Playwright reports from Jenkins build ${BUILD_NUMBER}" >/dev/null
                            git push -u origin gh-pages >/dev/null
                        fi
                    '''
                }

                archiveArtifacts artifacts: 'reports-url.txt',
                                 allowEmptyArchive: true,
                                 fingerprint: true
            }
        }
    }

    post {
        success {
            echo "Pipeline passed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }

        failure {
            echo "Pipeline failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }

        always {
            script {
                if (env.SLACK_ENABLED != 'true') {
                    echo 'Slack notifications disabled (set SLACK_ENABLED=true to enable)'
                    return
                }

                def pipelineResult = currentBuild.currentResult == 'SUCCESS' ? 'success' : 'failure'

                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    withCredentials([string(credentialsId: 'slack-webhook-url', variable: 'SLACK_WEBHOOK_URL')]) {
                        sh """
                            set +x
                            export PIPELINE_RESULT=${pipelineResult}
                            export BUILD_NUMBER=${env.BUILD_NUMBER}
                            export BUILD_URL=${env.BUILD_URL}
                            export BASE_URL=${env.BASE_URL}
                            node scripts/send-slack.mjs
                        """
                    }
                }
            }
        }

        cleanup {
            cleanWs(cleanWhenNotBuilt: false,
                    deleteDirs: true,
                    disableDeferredWipeout: true,
                    notFailBuild: true)
        }
    }
}
