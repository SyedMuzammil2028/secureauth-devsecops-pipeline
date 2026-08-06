# SecureAuth DevSecOps lab

This project now has a two-image Jenkins pipeline:

1. Test the FastAPI/backend code.
2. Type-check and build the React frontend.
3. Audit Python and npm dependencies.
4. Scan the repository for vulnerabilities, secrets, and misconfiguration with Trivy.
5. Optionally run SonarQube and enforce its quality gate.
6. Build and scan non-root backend and frontend container images.
7. Load the exact images into the local Minikube node.
8. Deploy to `dev`, then require approval for `staging` and `production`.

## Local paths and services

- Project: `/home/kali/Desktop/codes/secureauth-socket-system`
- Jenkins: `http://localhost:8081`
- SonarQube: `http://localhost:9000`
- Minikube profile: `devsecops`
- Kubernetes namespaces: `dev`, `staging`, `production`

## Create Kubernetes secrets

Do not commit credentials to Git. Export them in the current terminal and run the bootstrap script once for each environment:

```bash
export ADMIN_USERNAME='admin'
export ADMIN_PASSWORD='replace-with-a-strong-password'
export HMAC_SECRET_FALLBACK="$(openssl rand -hex 32)"
export SMTP_EMAIL='your-email@example.com'
export SMTP_PASSWORD='your-app-password'

for environment in dev staging production; do
  ./scripts/bootstrap-k8s-secrets.sh "$environment"
done

unset ADMIN_PASSWORD HMAC_SECRET_FALLBACK SMTP_PASSWORD
```

SMTP values may be empty for health-check-only deployments, but registration emails will not work.

## Run a local build and Dev deployment

```bash
docker build -f Dockerfile.backend -t secureauth-backend:local .
docker build -f Dockerfile.frontend -t secureauth-frontend:local .

docker save secureauth-backend:local | docker exec -i devsecops docker load
docker save secureauth-frontend:local | docker exec -i devsecops docker load

./scripts/deploy.sh dev secureauth-backend:local secureauth-frontend:local
kubectl -n dev port-forward service/secureauth-frontend 18080:8080
```

Open `http://localhost:18080`. The frontend proxies `/api` to the backend inside Kubernetes.

## Configure Jenkins

1. In Jenkins, create a **Pipeline** job named `secureauth-socket-system`.
2. Choose **Pipeline script from SCM**.
3. Select Git and enter `https://github.com/SyedMuzammil2028/secureauth-socket-system.git`.
4. Set the branch to `*/main` and the script path to `Jenkinsfile`.
5. Run the first build with `RUN_SONAR=false`.

For SonarQube analysis, create a SonarQube user token and save it in Jenkins as a **Secret text** credential with ID `sonar-token`. Then run the job with `RUN_SONAR=true`.

`ENFORCE_SECURITY_GATES` is disabled initially so the lab reports existing findings. Enable it after reviewing and fixing those findings; HIGH or CRITICAL results will then stop promotion.

## GitHub automation

The Jenkinsfile polls `main` every five minutes, which works while Jenkins is local. A GitHub webhook requires Jenkins to have a stable, public HTTPS address; do not expose the controller directly to the Internet.

