#!/usr/bin/env bash
# Starts one Rocket.Chat instance from the production bundle, with the harness routes on, and waits until it answers.
# usage: start-instance.sh <port> <db>
# env:   AGENT_STREAM_BUNDLE (the `meteor build --directory` output),
#        ROCKETCHAT_LICENSE, or ROCKETCHAT_LICENSE_FILE with the license in it (one is required),
#        AGENT_STREAM_LOGS (default: $AGENT_STREAM_BUNDLE/logs), MONGO_HOST (default: localhost:27017),
#        AGENT_STREAM_OBSERVABILITY=1 to send traces and metrics to agent-stream/docker-compose-observability.yml (default off)
set -euo pipefail

port=${1:?port}
db=${2:?db}
bundle=${AGENT_STREAM_BUNDLE:?set AGENT_STREAM_BUNDLE to the meteor build directory}
if [ -z "${ROCKETCHAT_LICENSE:-}" ] && [ -n "${ROCKETCHAT_LICENSE_FILE:-}" ]; then
	ROCKETCHAT_LICENSE=$(cat "$ROCKETCHAT_LICENSE_FILE")
fi
: "${ROCKETCHAT_LICENSE:?set ROCKETCHAT_LICENSE or ROCKETCHAT_LICENSE_FILE}"
logs=${AGENT_STREAM_LOGS:-$bundle/logs}
mkdir -p "$logs"
# the real binary at the repo's pinned version, not a version manager shim, so the pid file names the server
node_bin=$(cd "$(dirname "$0")" && node -p process.execPath)

# Prometheus_Enabled is a setting, and its override stays in the database: an off start must turn it off again.
obs=(OVERWRITE_SETTING_Prometheus_Enabled=false)
if [ "${AGENT_STREAM_OBSERVABILITY:-0}" = 1 ]; then
	obs=(
		OVERWRITE_SETTING_Prometheus_Enabled=true
		PROMETHEUS_PORT=$((port + 10000))
		TRACING_ENABLED=yes
		OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:19317
		OTEL_RESOURCE_ATTRIBUTES=service.instance.id=$port
	)
fi

if curl -sf "http://localhost:$port/_agent-stream/status" > /dev/null 2>&1; then
	echo "port $port already answers; stop it first" >&2
	exit 1
fi

(
	cd "$bundle/bundle"
	exec env \
		NODE_ENV=production \
		PORT="$port" \
		ROOT_URL="http://localhost:$port" \
		MONGO_URL="mongodb://${MONGO_HOST:-localhost:27017}/$db?directConnection=true" \
		INSTANCE_IP=127.0.0.1 \
		AGENT_STREAM_POC=1 \
		ROCKETCHAT_LICENSE="$ROCKETCHAT_LICENSE" \
		OVERWRITE_SETTING_Cloud_Url='https://my.staging.cloud.rocket.chat' \
		OVERWRITE_SETTING_Cloud_Billing_Url='https://billing.staging.cloud.rocket.chat' \
		OVERWRITE_INTERNAL_MARKETPLACE_URL='https://marketplace.staging.cloud.rocket.chat' \
		OVERWRITE_SETTING_Show_Setup_Wizard=completed \
		OVERWRITE_SETTING_API_Enable_Rate_Limiter=false \
		OVERWRITE_SETTING_Accounts_TwoFactorAuthentication_Enabled=false \
		ADMIN_USERNAME=as-admin \
		ADMIN_PASS=as-admin-pass \
		ADMIN_EMAIL=as-admin@example.com \
		"${obs[@]}" \
		"$node_bin" --expose-gc main.js
) > "$logs/$port.log" 2>&1 &
echo $! > "$logs/$port.pid"

for _ in $(seq 1 180); do
	if curl -sf "http://localhost:$port/_agent-stream/status" > /dev/null 2>&1; then
		echo "instance on $port is up (pid $(cat "$logs/$port.pid"), log $logs/$port.log)"
		exit 0
	fi
	if ! kill -0 "$(cat "$logs/$port.pid")" 2> /dev/null; then
		echo "instance on $port exited; see $logs/$port.log" >&2
		exit 1
	fi
	sleep 1
done
echo "instance on $port did not answer in 180 s; see $logs/$port.log" >&2
exit 1
