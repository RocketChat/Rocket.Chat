#!/usr/bin/env bash
# Run Rocket.Chat (Meteor dev) against the federation-matrix Docker stack (--use-local-rc).
# Prerequisites: /etc/hosts entries for rc1 and hs1 -> 127.0.0.1; compose stack up with test+rc-local.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FEDERATION_MATRIX_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
REPO_ROOT="$(cd "$FEDERATION_MATRIX_ROOT/../../.." && pwd)"
CA_CERT="$FEDERATION_MATRIX_ROOT/docker-compose/traefik/certs/ca/rootCA.crt"

if [[ ! -f "$CA_CERT" ]]; then
	echo "Missing CA bundle at $CA_CERT" >&2
	exit 1
fi

export ROOT_URL="${ROOT_URL:-https://rc1}"
export MONGO_URL="${MONGO_URL:-mongodb://127.0.0.1:27017/rc1?replicaSet=rs0&directConnection=true}"
export NODE_EXTRA_CA_CERTS="$CA_CERT"
export TEST_MODE="${TEST_MODE:-true}"
export LOG_LEVEL="${LOG_LEVEL:-debug}"
export OVERWRITE_SETTING_Show_Setup_Wizard="${OVERWRITE_SETTING_Show_Setup_Wizard:-completed}"
export OVERWRITE_SETTING_Federation_Service_Enabled="${OVERWRITE_SETTING_Federation_Service_Enabled:-true}"
export OVERWRITE_SETTING_Federation_Service_Domain="${OVERWRITE_SETTING_Federation_Service_Domain:-rc1}"
export OVERWRITE_SETTING_Cloud_Workspace_Client_Id="${OVERWRITE_SETTING_Cloud_Workspace_Client_Id:-temp_id}"
export OVERWRITE_SETTING_Cloud_Workspace_Client_Secret="${OVERWRITE_SETTING_Cloud_Workspace_Client_Secret:-temp_secret}"
export ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
export ADMIN_PASS="${ADMIN_PASS:-admin}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@admin.com}"
export ENTERPRISE_LICENSE_RC1="${ENTERPRISE_LICENSE_RC1:-ZAikY+LLaal7mT6RNYxpyWEmMQyucrl50/7pYBXqHczc90j+RLwF+T0xuCT2pIpKMC5DxcZ1TtkV6MYJk5whrwmap+mQ0FV+VpILJlL0i4T21K4vMfzZXTWm/pzcAy2fMTUNH+mUA9HTBD6lYYh40KnbGXPAd80VbZk0MO/WbWBm2dOT0YCwfvlRyurRqkDAQrftLaffzCNUsMKk0fh+MKs73UDHZQDp1yvs7WoGpPu5ZVi5mTBOt3ZKVz5KjGfClLwJptFPmW1w6nKelAiJBDPpjcX1ylfjxpnBoixko7uN52zlyaeoAYwfRcdDLnZ8k0Ou6tui/vTQUXjGIjHw2AhMaKwonn4E9LYpuA1KEXt08qJL5J3ZtjSCV1T+A9Z3zFhhLgp5dxP/PPUbxDn/P8XKp7nXM9duIfcCMlnea7V8ixEyCHwwvKQaXVVidcsUGtB8CwS0GlsAEBLOzqMehuQUK2rdQ4WgEz3AYveikeVvSzgBHvyXsxssWAThc0Mht0eEJqdDhUB2QeZ2WmPsaSSD639Z4WgjSUoR0zh8bfqepH+2XRcUryXe2yN+iU+3POzi9wfg0k65MxXT8pBg3PD5RHnR8oflEP0tpZts33JiBhYRxX3MKplAFm4dMuphTsDJTh+e534pT7IPuZF79QSVaLEWZfVVVb7nGFtmMwA=}"
export ROCKETCHAT_LICENSE="${ROCKETCHAT_LICENSE:-$ENTERPRISE_LICENSE_RC1}"

cd "$REPO_ROOT"
exec yarn dsv
