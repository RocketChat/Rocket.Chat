#!/usr/bin/env bash
# Stops the instances that start-instance.sh started on the given ports. usage: stop.sh <port>...
set -uo pipefail
logs=${AGENT_STREAM_LOGS:-${AGENT_STREAM_BUNDLE:?set AGENT_STREAM_BUNDLE}/logs}
for port in "$@"; do
	pidfile="$logs/$port.pid"
	[ -f "$pidfile" ] || continue
	pid=$(cat "$pidfile")
	kill "$pid" 2> /dev/null && for _ in $(seq 1 30); do kill -0 "$pid" 2> /dev/null || break; sleep 1; done
	kill -9 "$pid" 2> /dev/null
	rm -f "$pidfile"
	echo "stopped $port"
done
