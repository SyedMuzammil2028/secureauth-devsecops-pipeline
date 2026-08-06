pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 60, unit: 'MINUTES')
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    parameters {
        booleanParam(
            name: 'RUN_SONAR',
            defaultValue: false,
            description: 'Run SonarQube analysis after the sonar-token credential is configured.'
        )
        booleanParam(
            name: 'ENFORCE_SECURITY_GATES',
            defaultValue: false,
            description: 'Fail on HIGH/CRITICAL dependency, repository, or image findings.'
        )
    }

    environment {
        BACKEND_IMAGE = "secureauth-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "secureauth-frontend:${BUILD_NUMBER}"
        MINIKUBE_PROFILE = 'devsecops'
        SONAR_HOST_URL = 'http://sonarqube:9000'
    }

    stages {
        stage('Backend tests') {
            steps {
                sh '''
                    set -eu
                    docker run --rm \
                        --env PYTHONDONTWRITEBYTECODE=1 \
                        --volume "$WORKSPACE:/workspace" \
                        --workdir /workspace \
                        python:3.11-slim-trixie \
                        sh -c 'python -m pip install --quiet --disable-pip-version-check -r requirements.txt && python -m unittest discover -s tests -v'
                '''
            }
        }

        stage('Frontend checks') {
            steps {
                sh '''
                    set -eu
                    docker run --rm \
                        --env HOME=/tmp \
                        --volume "$WORKSPACE/frontend:/app" \
                        --workdir /app \
                        node:22-slim \
                        sh -c 'npm ci && npm run typecheck && npm run build'
                '''
            }
        }

        stage('Dependency audit') {
            steps {
                sh '''
                    set -u
                    failed=0
                    docker run --rm \
                        --volume "$WORKSPACE:/workspace" \
                        --workdir /workspace \
                        python:3.11-slim-trixie \
                        sh -c 'python -m pip install --quiet pip-audit && python -m pip_audit -r requirements.txt' || failed=1

                    docker run --rm \
                        --volume "$WORKSPACE/frontend:/app" \
                        --workdir /app \
                        node:22-slim \
                        npm audit --omit=dev --audit-level=high || failed=1

                    if [ "$failed" -ne 0 ] && [ "$ENFORCE_SECURITY_GATES" = "true" ]; then
                        exit 1
                    fi
                    if [ "$failed" -ne 0 ]; then
                        echo 'Dependency findings reported; enforcement is disabled for this learning build.'
                    fi
                '''
            }
        }

        stage('Repository security scan') {
            steps {
                sh '''
                    set -eu
                    exit_code=0
                    [ "$ENFORCE_SECURITY_GATES" = "true" ] && exit_code=1
                    mkdir -p reports
                    trivy fs --scanners vuln,secret,misconfig \
                        --severity HIGH,CRITICAL --exit-code "$exit_code" \
                        --skip-dirs .git --skip-dirs frontend/node_modules \
                        --format json --output reports/trivy-filesystem.json .
                    trivy fs --scanners vuln,secret,misconfig \
                        --severity HIGH,CRITICAL --exit-code 0 \
                        --skip-dirs .git --skip-dirs frontend/node_modules .
                '''
            }
        }

        stage('SonarQube analysis') {
            when {
                expression { params.RUN_SONAR }
            }
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        set -eu
                        sonar-scanner \
                            -Dsonar.host.url="$SONAR_HOST_URL" \
                            -Dsonar.token="$SONAR_TOKEN"

                        task_url=$(sed -n 's/^ceTaskUrl=//p' .scannerwork/report-task.txt)
                        attempt=0
                        while [ "$attempt" -lt 30 ]; do
                            task_json=$(curl --fail --silent --user "$SONAR_TOKEN:" "$task_url")
                            task_status=$(printf '%s' "$task_json" | jq -r '.task.status')
                            case "$task_status" in
                                SUCCESS)
                                    analysis_id=$(printf '%s' "$task_json" | jq -r '.task.analysisId')
                                    break
                                    ;;
                                FAILED|CANCELED)
                                    echo "SonarQube compute task: $task_status"
                                    exit 1
                                    ;;
                            esac
                            attempt=$((attempt + 1))
                            sleep 2
                        done
                        test -n "${analysis_id:-}"
                        gate=$(curl --fail --silent --user "$SONAR_TOKEN:" \
                            "$SONAR_HOST_URL/api/qualitygates/project_status?analysisId=$analysis_id" \
                            | jq -r '.projectStatus.status')
                        echo "SonarQube quality gate: $gate"
                        test "$gate" = "OK"
                    '''
                }
            }
        }

        stage('Build container images') {
            steps {
                sh '''
                    set -eu
                    docker build --pull --file Dockerfile.backend --tag "$BACKEND_IMAGE" .
                    docker build --pull --file Dockerfile.frontend --tag "$FRONTEND_IMAGE" .
                '''
            }
        }

        stage('Container vulnerability scan') {
            steps {
                sh '''
                    set -eu
                    exit_code=0
                    [ "$ENFORCE_SECURITY_GATES" = "true" ] && exit_code=1
                    mkdir -p reports
                    trivy image --severity HIGH,CRITICAL --ignore-unfixed \
                        --exit-code "$exit_code" --format json \
                        --output reports/trivy-backend-image.json "$BACKEND_IMAGE"
                    trivy image --severity HIGH,CRITICAL --ignore-unfixed \
                        --exit-code "$exit_code" --format json \
                        --output reports/trivy-frontend-image.json "$FRONTEND_IMAGE"
                '''
            }
        }

        stage('Load images into Minikube') {
            steps {
                sh '''
                    set -eu
                    docker save "$BACKEND_IMAGE" | docker exec -i "$MINIKUBE_PROFILE" docker load
                    docker save "$FRONTEND_IMAGE" | docker exec -i "$MINIKUBE_PROFILE" docker load
                '''
            }
        }

        stage('Deploy: dev') {
            steps {
                sh './scripts/deploy.sh dev "$BACKEND_IMAGE" "$FRONTEND_IMAGE"'
            }
        }

        stage('Approve staging') {
            when {
                anyOf {
                    branch 'main'
                    expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' }
                }
            }
            input {
                message 'Promote these tested images to staging?'
                ok 'Deploy staging'
            }
            steps {
                echo 'Staging promotion approved.'
            }
        }

        stage('Deploy: staging') {
            when {
                anyOf {
                    branch 'main'
                    expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' }
                }
            }
            steps {
                sh './scripts/deploy.sh staging "$BACKEND_IMAGE" "$FRONTEND_IMAGE"'
            }
        }

        stage('Approve production') {
            when {
                anyOf {
                    branch 'main'
                    expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' }
                }
            }
            input {
                message 'Promote these exact images to production?'
                ok 'Deploy production'
                submitterParameter 'APPROVER'
            }
            steps {
                echo "Production promotion approved by ${APPROVER}."
            }
        }

        stage('Deploy: production') {
            when {
                anyOf {
                    branch 'main'
                    expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' }
                }
            }
            steps {
                sh './scripts/deploy.sh production "$BACKEND_IMAGE" "$FRONTEND_IMAGE"'
            }
        }
    }

    post {
        always {
            archiveArtifacts allowEmptyArchive: true,
                artifacts: 'reports/**,.scannerwork/report-task.txt'
        }
    }
}
