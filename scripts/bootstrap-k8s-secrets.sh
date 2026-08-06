#!/bin/sh
set -eu

environment=${1:-}
kubectl_bin=${KUBECTL_BIN:-kubectl}
case "$environment" in
    dev|staging|production) ;;
    *) echo "Usage: $0 <dev|staging|production>" >&2; exit 2 ;;
esac

: "${ADMIN_USERNAME:?Set ADMIN_USERNAME before running this script}"
: "${ADMIN_PASSWORD:?Set ADMIN_PASSWORD before running this script}"
: "${HMAC_SECRET_FALLBACK:?Set HMAC_SECRET_FALLBACK before running this script}"

SMTP_EMAIL=${SMTP_EMAIL:-}
SMTP_PASSWORD=${SMTP_PASSWORD:-}

"$kubectl_bin" get namespace "$environment" >/dev/null 2>&1 || "$kubectl_bin" create namespace "$environment"

"$kubectl_bin" --namespace "$environment" create secret generic secureauth-secrets \
    --from-literal=ADMIN_USERNAME="$ADMIN_USERNAME" \
    --from-literal=ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    --from-literal=HMAC_SECRET_FALLBACK="$HMAC_SECRET_FALLBACK" \
    --from-literal=SMTP_EMAIL="$SMTP_EMAIL" \
    --from-literal=SMTP_PASSWORD="$SMTP_PASSWORD" \
    --dry-run=client --output=yaml \
    | "$kubectl_bin" apply --filename=-

echo "Secret secureauth-secrets configured in namespace $environment."
