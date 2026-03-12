#!/usr/bin/env bash

set -euo pipefail

service="${1:-}"

if [[ -z "$service" ]]; then
	echo "usage: $0 <service-name>" >&2
	exit 1
fi

resolve_image() {
	local compose_args="$1"
	local service_name="$2"
	local image

	image=$(docker compose ${compose_args} config --format json 2>/dev/null | jq -r --arg s "$service_name" '.services[$s].image')

	if [[ -z "$image" || "$image" == "null" ]]; then
		echo "failed to resolve compose image for service '${service_name}'" >&2
		exit 1
	fi

	echo "$image"
}

if [[ "$service" == "rocketchat-cov" ]]; then
	base_image=$(resolve_image "-f docker-compose-ci.yml" "rocketchat")
	echo "${base_image}-cov"
	exit 0
fi

if [[ "$service" == *"-fips" ]]; then
	base_service="${service%-fips}"
	resolve_image "-f docker-compose-ci.yml -f docker-compose-ci.fips.yml" "$base_service"
	exit 0
fi

resolve_image "-f docker-compose-ci.yml" "$service"
