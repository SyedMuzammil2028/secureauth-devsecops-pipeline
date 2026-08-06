#!/bin/sh
set -eu

environment=${1:-}
backend_image=${2:-}
frontend_image=${3:-}

case "$environment" in
    dev)
        app_environment=development
        frontend_port=18080
        ;;
    staging)
        app_environment=staging
        frontend_port=18081
        ;;
    production)
        app_environment=production
        frontend_port=18082
        ;;
    *)
        echo "Usage: $0 <dev|staging|production> <backend-image> <frontend-image>" >&2
        exit 2
        ;;
esac

if [ -z "$backend_image" ] || [ -z "$frontend_image" ]; then
    echo 'Both backend and frontend image names are required.' >&2
    exit 2
fi

: "${ADMIN_USERNAME:?Jenkins credential ADMIN_USERNAME is required}"
: "${ADMIN_PASSWORD:?Jenkins credential ADMIN_PASSWORD is required}"
: "${HMAC_SECRET_FALLBACK:?Jenkins credential HMAC_SECRET_FALLBACK is required}"

network="secureauth-${environment}"
backend_container="secureauth-backend-${environment}"
frontend_container="secureauth-frontend-${environment}"
data_volume="secureauth-data-${environment}"

wait_for_healthy() {
    container_name=$1
    attempts=0

    while [ "$attempts" -lt 36 ]; do
        state=$(docker inspect --format '{{.State.Status}}' "$container_name" 2>/dev/null || true)
        health=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_name" 2>/dev/null || true)

        if [ "$health" = 'healthy' ]; then
            echo "$container_name is healthy."
            return 0
        fi

        if [ "$state" = 'exited' ] || [ "$state" = 'dead' ]; then
            echo "$container_name stopped before becoming healthy." >&2
            docker logs --tail 100 "$container_name" >&2 || true
            return 1
        fi

        attempts=$((attempts + 1))
        sleep 5
    done

    echo "$container_name did not become healthy in time." >&2
    docker logs --tail 100 "$container_name" >&2 || true
    return 1
}

docker network inspect "$network" >/dev/null 2>&1 || docker network create "$network" >/dev/null
docker volume inspect "$data_volume" >/dev/null 2>&1 || docker volume create "$data_volume" >/dev/null

docker rm --force "$frontend_container" >/dev/null 2>&1 || true
docker rm --force "$backend_container" >/dev/null 2>&1 || true

# A new named volume is owned by root. Set ownership before the non-root
# backend process initializes its SQLite database.
docker run --rm \
    --user 0:0 \
    --entrypoint sh \
    --volume "${data_volume}:/data" \
    "$backend_image" \
    -c 'chown -R 10001:10001 /data'

docker run --detach \
    --name "$backend_container" \
    --network "$network" \
    --network-alias secureauth-backend \
    --restart unless-stopped \
    --label "com.secureauth.environment=${environment}" \
    --env "APP_ENV=${app_environment}" \
    --env DB_PATH=/data/auth_system.db \
    --env ADMIN_USERNAME \
    --env ADMIN_PASSWORD \
    --env HMAC_SECRET_FALLBACK \
    --env SMTP_HOST=smtp.gmail.com \
    --env SMTP_PORT=587 \
    --env SMTP_TIMEOUT_SECONDS=10 \
    --volume "${data_volume}:/data" \
    --read-only \
    --tmpfs /tmp:rw,noexec,nosuid,size=64m \
    --security-opt no-new-privileges:true \
    --cap-drop ALL \
    --memory 384m \
    --cpus 0.50 \
    "$backend_image" >/dev/null

wait_for_healthy "$backend_container"

docker run --detach \
    --name "$frontend_container" \
    --network "$network" \
    --network-alias secureauth-frontend \
    --restart unless-stopped \
    --label "com.secureauth.environment=${environment}" \
    --publish "${frontend_port}:8080" \
    --read-only \
    --tmpfs /var/cache/nginx:rw,noexec,nosuid,size=32m \
    --tmpfs /var/run:rw,noexec,nosuid,size=8m \
    --tmpfs /tmp:rw,noexec,nosuid,size=16m \
    --security-opt no-new-privileges:true \
    --cap-drop ALL \
    --memory 128m \
    --cpus 0.25 \
    "$frontend_image" >/dev/null

wait_for_healthy "$frontend_container"

docker exec "$frontend_container" \
    wget --quiet --tries=1 --spider http://secureauth-backend:8000/health

echo "SecureAuth ${environment} deployment is healthy."
echo "Open: http://localhost:${frontend_port}"
