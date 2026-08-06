#!/bin/sh
set -eu

environment=${1:-}
backend_image=${2:-}
frontend_image=${3:-}
kubectl_bin=${KUBECTL_BIN:-kubectl}

case "$environment" in
    dev|staging|production) ;;
    *) echo "Usage: $0 <dev|staging|production> <backend-image> <frontend-image>" >&2; exit 2 ;;
esac

if [ -z "$backend_image" ] || [ -z "$frontend_image" ]; then
    echo "Both backend and frontend image names are required." >&2
    exit 2
fi

"$kubectl_bin" get namespace "$environment" >/dev/null 2>&1 || "$kubectl_bin" create namespace "$environment"

if ! "$kubectl_bin" --namespace "$environment" get secret secureauth-secrets >/dev/null 2>&1; then
    echo "Missing secret secureauth-secrets in namespace $environment." >&2
    echo "Run: ./scripts/bootstrap-k8s-secrets.sh $environment" >&2
    exit 1
fi

"$kubectl_bin" apply --kustomize "k8s/overlays/$environment"
"$kubectl_bin" --namespace "$environment" set image deployment/secureauth-backend backend="$backend_image"
"$kubectl_bin" --namespace "$environment" set image deployment/secureauth-frontend frontend="$frontend_image"
"$kubectl_bin" --namespace "$environment" rollout status deployment/secureauth-backend --timeout=180s
"$kubectl_bin" --namespace "$environment" rollout status deployment/secureauth-frontend --timeout=180s

attempt=1
while ! "$kubectl_bin" --namespace "$environment" exec deployment/secureauth-frontend -- \
    wget --quiet --output-document=- http://secureauth-backend:8000/health; do
    if [ "$attempt" -ge 15 ]; then
        echo "Backend service health check failed after $attempt attempts." >&2
        exit 1
    fi
    attempt=$((attempt + 1))
    sleep 2
done
echo
echo "Deployment is healthy. Open it with:"
echo "kubectl --namespace $environment port-forward service/secureauth-frontend 18080:8080"
