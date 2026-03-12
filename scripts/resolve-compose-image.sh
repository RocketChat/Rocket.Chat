#!/usr/bin/env bash

set -euo pipefail

service="${1:-}"

if [[ -z "$service" ]]; then
	echo "usage: $0 <service-name>" >&2
	exit 1
fi

if [[ "$service" == "rocketchat-cov" ]]; then
	docker compose -f docker-compose-ci.yml config --format json 2>/dev/null \
		| jq -r --arg s "rocketchat" '.services[$s].image' \
		| awk '{ print $0 "-cov" }'
	exit 0
fi

if [[ "$service" == *"-fips" ]]; then
	base_service="${service%-fips}"
	docker compose -f docker-compose-ci.yml -f docker-compose-ci.fips.yml config --format json 2>/dev/null \
		| jq -r --arg s "$base_service" '.services[$s].image'
	exit 0
fi

docker compose -f docker-compose-ci.yml config --format json 2>/dev/null \
	| jq -r --arg s "$service" '.services[$s].image'
