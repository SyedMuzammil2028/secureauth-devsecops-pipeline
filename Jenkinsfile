pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
        timestamps()
        timeout(time: 90, unit: 'MINUTES')
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    parameters {
        booleanParam(
            name: 'DEPLOY_STAGING',
            defaultValue: false,
            description: 'Pause for approval and promote the tested images to Docker staging.'
        )
        booleanParam(
            name: 'DEPLOY_PRODUCTION',
            defaultValue: false,
            description: 'After staging, pause again and promote the same images to Docker production.'
        )
        booleanParam(
            name: 'ENFORCE_GITLEAKS',
            defaultValue: true,
            description: 'Fail when Gitleaks detects a potential committed secret.'
        )
        booleanParam(
            name: 'ENFORCE_DEPENDENCY_AUDIT',
            defaultValue: false,
            description: 'Fail on high-severity Python, npm, or repository findings.'
        )
        booleanParam(
            name: 'ENFORCE_TRIVY',
            defaultValue: false,
            description: 'Fail on fixed HIGH or CRITICAL vulnerabilities in either image.'
        )
        booleanParam(
            name: 'ENFORCE_GRYPE',
            defaultValue: false,
            description: 'Fail when Grype reports HIGH or CRITICAL image vulnerabilities.'
        )
        booleanParam(
            name: 'RUN_ZAP_DAST',
            defaultValue: true,
            description: 'Run an OWASP ZAP baseline scan against the Docker dev deployment.'
        )
        booleanParam(
            name: 'ENFORCE_ZAP',
            defaultValue: false,
            description: 'Fail when OWASP ZAP reports application security warnings or failures.'
        )
    }

    environment {
        JENKINS_CONTAINER = 'devsecops-jenkins'

        BACKEND_IMAGE = "secureauth-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "secureauth-frontend:${BUILD_NUMBER}"

        PYTHON_TEST_IMAGE = 'python:3.11-slim-trixie'
        NODE_TEST_IMAGE = 'node:22-slim'
        GITLEAKS_IMAGE = 'ghcr.io/gitleaks/gitleaks:latest'
        ZAP_IMAGE = 'ghcr.io/zaproxy/zaproxy:stable'

        DEV_NETWORK = 'secureauth-dev'
        DEV_FRONTEND_CONTAINER = 'secureauth-frontend-dev'
        ZAP_TARGET = 'http://secureauth-frontend:8080'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh '''
                    set -eu
                    mkdir -p reports

                    if [ "$DEPLOY_PRODUCTION" = "true" ] && [ "$DEPLOY_STAGING" != "true" ]; then
                        echo 'DEPLOY_PRODUCTION requires DEPLOY_STAGING.' >&2
                        exit 2
                    fi
                '''
            }
        }

        stage('Gitleaks Secret Scan') {
            steps {
                sh '''
                    set -eu
                    mkdir -p reports

                    echo 'Scanning Git history for passwords, tokens and API keys.'
                    set +e
                    docker run --rm \
                        --volumes-from "$JENKINS_CONTAINER" \
                        --workdir "$WORKSPACE" \
                        --user "$(id -u):$(id -g)" \
                        "$GITLEAKS_IMAGE" \
                        git \
                        --redact \
                        --verbose \
                        --exit-code 10 \
                        --report-format json \
                        --report-path reports/gitleaks-report.json \
                        .
                    gitleaks_status=$?
                    set -e

                    case "$gitleaks_status" in
                        0)
                            echo 'Gitleaks completed: no potential secrets detected.'
                            ;;
                        10)
                            echo 'Gitleaks detected potential secrets.'
                            echo 'Review reports/gitleaks-report.json.'
                            if [ "$ENFORCE_GITLEAKS" = "true" ]; then
                                exit 1
                            fi
                            echo 'Gitleaks enforcement is disabled; continuing for demonstration.'
                            ;;
                        *)
                            echo "Gitleaks execution failed with status $gitleaks_status." >&2
                            exit "$gitleaks_status"
                            ;;
                    esac
                '''
            }
        }

        stage('Backend Tests') {
            steps {
                sh '''
                    set -eu
                    mkdir -p reports
                    docker run --rm \
                        --env PYTHONDONTWRITEBYTECODE=1 \
                        --volumes-from "$JENKINS_CONTAINER" \
                        --workdir "$WORKSPACE" \
                        "$PYTHON_TEST_IMAGE" \
                        sh -c 'python -m pip install --quiet --disable-pip-version-check \
                                   -r requirements.txt pytest==8.3.5 pytest-cov==6.0.0 && \
                               python -m pytest -v tests \
                                   --junitxml=reports/backend-junit.xml \
                                   --cov=backend \
                                   --cov-report=term \
                                   --cov-report=xml:reports/backend-coverage.xml'
                '''
            }
        }

        stage('Frontend Typecheck, Tests and Build') {
            steps {
                sh '''
                    set -eu
                    mkdir -p reports
                    docker run --rm \
                        --env HOME=/tmp \
                        --volumes-from "$JENKINS_CONTAINER" \
                        --workdir "$WORKSPACE/frontend" \
                        "$NODE_TEST_IMAGE" \
                        sh -c 'npm ci && \
                               npm run typecheck && \
                               npm test -- \
                                   --reporter=default \
                                   --reporter=junit \
                                   --outputFile.junit=../reports/frontend-junit.xml && \
                               npm run build'
                '''
            }
        }

        stage('Dependency Audit') {
            steps {
                sh '''
                    set -u
                    mkdir -p reports
                    audit_failed=0

                    docker run --rm \
                        --env PYTHONDONTWRITEBYTECODE=1 \
                        --volumes-from "$JENKINS_CONTAINER" \
                        --workdir "$WORKSPACE" \
                        "$PYTHON_TEST_IMAGE" \
                        sh -c 'python -m pip install --quiet --disable-pip-version-check pip-audit && \
                               python -m pip_audit \
                                   --requirement requirements.txt \
                                   --format json \
                                   --output reports/pip-audit.json' || audit_failed=1

                    docker run --rm \
                        --env HOME=/tmp \
                        --volumes-from "$JENKINS_CONTAINER" \
                        --workdir "$WORKSPACE/frontend" \
                        "$NODE_TEST_IMAGE" \
                        sh -c 'npm audit --omit=dev --audit-level=high --json \
                                   > ../reports/npm-audit.json' || audit_failed=1

                    trivy fs \
                        --scanners vuln,secret,misconfig \
                        --severity HIGH,CRITICAL \
                        --exit-code 0 \
                        --skip-dirs .git \
                        --skip-dirs frontend/node_modules \
                        --format json \
                        --output reports/trivy-repository.json \
                        .

                    trivy fs \
                        --scanners vuln,secret,misconfig \
                        --severity HIGH,CRITICAL \
                        --exit-code 0 \
                        --skip-dirs .git \
                        --skip-dirs frontend/node_modules \
                        .

                    if [ "$audit_failed" -ne 0 ]; then
                        if [ "$ENFORCE_DEPENDENCY_AUDIT" = "true" ]; then
                            echo 'Dependency audit enforcement is enabled.' >&2
                            exit 1
                        fi
                        echo 'Dependency findings were recorded; enforcement is disabled.'
                    fi
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('secureauth-sonarqube') {
                    sh '''
                        set -eu
                        sonar-scanner \
                            -Dsonar.host.url="$SONAR_HOST_URL" \
                            -Dsonar.token="$SONAR_AUTH_TOKEN"
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Backend and Frontend Images') {
            steps {
                sh '''
                    set -eu
                    docker build --pull \
                        --file Dockerfile.backend \
                        --tag "$BACKEND_IMAGE" \
                        .
                    docker build --pull \
                        --file Dockerfile.frontend \
                        --tag "$FRONTEND_IMAGE" \
                        .
                '''
            }
        }

        stage('Trivy Scan - Both Images') {
            steps {
                sh '''
                    set -eu
                    mkdir -p reports
                    exit_code=0
                    scan_failed=0
                    if [ "$ENFORCE_TRIVY" = "true" ]; then
                        exit_code=1
                    fi

                    if ! trivy image \
                        --severity HIGH,CRITICAL \
                        --ignore-unfixed \
                        --exit-code "$exit_code" \
                        --format json \
                        --output reports/trivy-backend-image.json \
                        "$BACKEND_IMAGE"; then
                        scan_failed=1
                    fi

                    if ! trivy image \
                        --severity HIGH,CRITICAL \
                        --ignore-unfixed \
                        --exit-code "$exit_code" \
                        --format json \
                        --output reports/trivy-frontend-image.json \
                        "$FRONTEND_IMAGE"; then
                        scan_failed=1
                    fi

                    echo 'Backend image findings:'
                    trivy image \
                        --severity HIGH,CRITICAL \
                        --ignore-unfixed \
                        --exit-code 0 \
                        "$BACKEND_IMAGE"

                    echo 'Frontend image findings:'
                    trivy image \
                        --severity HIGH,CRITICAL \
                        --ignore-unfixed \
                        --exit-code 0 \
                        "$FRONTEND_IMAGE"

                    if [ "$scan_failed" -ne 0 ]; then
                        echo 'Trivy enforcement is enabled and findings exceeded the policy.' >&2
                        exit 1
                    fi
                '''
            }
        }

        stage('Grype Scan - Both Images') {
            steps {
                grypeScan(
                    scanDest: "docker:${env.BACKEND_IMAGE}",
                    repName: 'grype-backend-report.txt',
                    autoInstall: true
                )
                sh '''
                    set -eu
                    test -s grype-report.json
                    cp grype-report.json reports/grype-backend-report.json
                '''
                grypeScan(
                    scanDest: "docker:${env.FRONTEND_IMAGE}",
                    repName: 'grype-frontend-report.txt',
                    autoInstall: true
                )
                sh '''
                    set -eu
                    test -s grype-report.json
                    cp grype-report.json reports/grype-frontend-report.json
                '''
            }
        }

        stage('Grype Warnings Check') {
            steps {
                script {
                    if (params.ENFORCE_GRYPE) {
                        recordIssues(
                            tools: [grype(pattern: 'reports/grype-*-report.json')],
                            aggregatingResults: true,
                            qualityGates: [
                                [
                                    threshold: 1,
                                    type: 'TOTAL_ERROR',
                                    criticality: 'FAILURE'
                                ],
                                [
                                    threshold: 1,
                                    type: 'TOTAL_HIGH',
                                    criticality: 'FAILURE'
                                ]
                            ]
                        )
                    } else {
                        recordIssues(
                            tools: [grype(pattern: 'reports/grype-*-report.json')],
                            aggregatingResults: true
                        )
                    }
                }
            }
        }

        stage('Deploy Dev') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'secureauth-admin',
                        usernameVariable: 'ADMIN_USERNAME',
                        passwordVariable: 'ADMIN_PASSWORD'
                    ),
                    string(
                        credentialsId: 'secureauth-hmac-secret',
                        variable: 'HMAC_SECRET_FALLBACK'
                    )
                ]) {
                    sh 'sh ./scripts/docker-deploy.sh dev "$BACKEND_IMAGE" "$FRONTEND_IMAGE"'
                }
            }
        }

        stage('OWASP ZAP DAST') {
            when {
                expression { params.RUN_ZAP_DAST }
            }
            steps {
                sh '''
                    set -eu
                    mkdir -p reports

                    docker exec "$DEV_FRONTEND_CONTAINER" \
                        wget --quiet --tries=1 --spider \
                        http://127.0.0.1:8080/healthz

                    zap_container="zap-secureauth-${BUILD_NUMBER}"
                    cleanup_zap() {
                        docker rm --force --volumes "$zap_container" \
                            >/dev/null 2>&1 || true
                    }
                    trap cleanup_zap EXIT INT TERM

                    echo "Running OWASP ZAP Baseline Scan against $ZAP_TARGET"
                    set +e
                    docker run \
                        --name "$zap_container" \
                        --network "$DEV_NETWORK" \
                        --user 0:0 \
                        --volume /zap/wrk \
                        "$ZAP_IMAGE" \
                        zap-baseline.py \
                        -t "$ZAP_TARGET" \
                        -m 1 \
                        -T 5 \
                        -r zap-secureauth-report.html \
                        -J zap-secureauth-report.json \
                        -x zap-secureauth-report.xml
                    zap_status=$?
                    set -e

                    for report in \
                        zap-secureauth-report.html \
                        zap-secureauth-report.json \
                        zap-secureauth-report.xml; do
                        docker cp \
                            "${zap_container}:/zap/wrk/${report}" \
                            "reports/${report}" 2>/dev/null || true
                    done

                    if [ ! -s reports/zap-secureauth-report.html ]; then
                        echo 'OWASP ZAP did not produce the expected report.' >&2
                        exit 3
                    fi

                    case "$zap_status" in
                        0)
                            echo 'OWASP ZAP completed without policy findings.'
                            ;;
                        1|2)
                            echo "OWASP ZAP completed with security findings (status $zap_status)."
                            if [ "$ENFORCE_ZAP" = "true" ]; then
                                exit "$zap_status"
                            fi
                            echo 'ZAP enforcement is disabled; reports were archived for review.'
                            ;;
                        *)
                            echo "OWASP ZAP execution failed with status $zap_status." >&2
                            exit "$zap_status"
                            ;;
                    esac
                '''
            }
        }

        stage('Approve Staging') {
            when {
                expression { params.DEPLOY_STAGING }
            }
            input {
                message 'Promote these tested Docker images to staging?'
                ok 'Approve staging'
                submitterParameter 'STAGING_APPROVER'
            }
            steps {
                echo "Staging approved by ${STAGING_APPROVER}."
            }
        }

        stage('Deploy Staging') {
            when {
                expression { params.DEPLOY_STAGING }
            }
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'secureauth-admin',
                        usernameVariable: 'ADMIN_USERNAME',
                        passwordVariable: 'ADMIN_PASSWORD'
                    ),
                    string(
                        credentialsId: 'secureauth-hmac-secret',
                        variable: 'HMAC_SECRET_FALLBACK'
                    )
                ]) {
                    sh 'sh ./scripts/docker-deploy.sh staging "$BACKEND_IMAGE" "$FRONTEND_IMAGE"'
                }
            }
        }

        stage('Approve Production') {
            when {
                expression { params.DEPLOY_PRODUCTION }
            }
            input {
                message 'Promote these exact Docker images to production?'
                ok 'Approve production'
                submitterParameter 'PRODUCTION_APPROVER'
            }
            steps {
                echo "Production approved by ${PRODUCTION_APPROVER}."
            }
        }

        stage('Deploy Production') {
            when {
                expression { params.DEPLOY_PRODUCTION }
            }
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'secureauth-admin',
                        usernameVariable: 'ADMIN_USERNAME',
                        passwordVariable: 'ADMIN_PASSWORD'
                    ),
                    string(
                        credentialsId: 'secureauth-hmac-secret',
                        variable: 'HMAC_SECRET_FALLBACK'
                    )
                ]) {
                    sh 'sh ./scripts/docker-deploy.sh production "$BACKEND_IMAGE" "$FRONTEND_IMAGE"'
                }
            }
        }

        stage('Archive Reports') {
            steps {
                junit(
                    allowEmptyResults: true,
                    testResults: 'reports/backend-junit.xml,reports/frontend-junit.xml'
                )
                archiveArtifacts(
                    allowEmptyArchive: true,
                    artifacts: 'reports/**,grype-*-report.txt,grype-*-report.json,.scannerwork/report-task.txt'
                )
            }
        }
    }

    post {
        unsuccessful {
            junit(
                allowEmptyResults: true,
                testResults: 'reports/backend-junit.xml,reports/frontend-junit.xml'
            )
            archiveArtifacts(
                allowEmptyArchive: true,
                artifacts: 'reports/**,grype-*-report.txt,grype-*-report.json,.scannerwork/report-task.txt'
            )
        }
        success {
            echo 'SecureAuth DevSecOps pipeline completed successfully.'
            echo 'Docker dev URL: http://localhost:18080'
            script {
                if (params.DEPLOY_STAGING) {
                    echo 'Docker staging URL: http://localhost:18081'
                }
                if (params.DEPLOY_PRODUCTION) {
                    echo 'Docker production URL: http://localhost:18082'
                }
            }
        }
    }
}
