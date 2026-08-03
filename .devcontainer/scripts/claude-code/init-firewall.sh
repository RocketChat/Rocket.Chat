#!/bin/bash
set -Eeuo pipefail  # Exit on error (incl. inside functions), undefined vars, pipe failures
IFS=$'\n\t'        # Stricter word splitting

# Default-deny egress firewall for the Rocket.Chat dev container.
# Adapted from the Claude Code reference:
#   https://github.com/anthropics/claude-code/blob/main/.devcontainer/init-firewall.sh
# The allowlist is extended for this repo's toolchain (Deno, Meteor, Volta/Node,
# yarn) and Claude Code auth. Mongo needs no rule at all: `meteor` runs its own
# bundled mongod on 127.0.0.1:3001, which the loopback rule covers.
#
# Design notes (differences from the reference script):
#   * The allowlist is resolved FIRST and the iptables rules are applied LAST, in
#     one go, so a transient DNS/network hiccup can never leave the container
#     half-firewalled.
#   * No single lookup is fatal. The reference script aborts if api.github.com is
#     unreachable; on a flaky network — or when postStartCommand wins the race
#     against Docker's embedded resolver — that killed the whole run with
#     `curl: (6) Could not resolve host` and left the container with no working
#     egress policy. Here DNS is waited for, every fetch retries, GitHub falls
#     back to its published static ranges, and the firewall is applied regardless.
#   * IPv6 is denied outright — the allowlist is IPv4-only, so leaving ip6tables
#     open would be a trivial bypass of the whole policy.

log() { echo "[firewall] $*"; }
warn() { echo "[firewall] WARNING: $*" >&2; }
die() { echo "[firewall] ERROR: $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "must run as root (use sudo)"
for bin in iptables ip6tables ipset dig curl jq aggregate; do
    command -v "$bin" >/dev/null || die "missing required tool: $bin"
done

# Retry helper: retry <attempts> <sleep-seconds> <command...>
retry() {
    local attempts=$1 delay=$2 n=1
    shift 2
    until "$@"; do
        if [ "$n" -ge "$attempts" ]; then
            return 1
        fi
        n=$((n + 1))
        sleep "$delay"
    done
}

# Every allowed IP/CIDR is collected here first; nothing is applied until the
# list is complete (or we give up on completing it).
ALLOWED_CIDRS=$(mktemp)
trap 'rm -f "$ALLOWED_CIDRS"' EXIT

# ---------------------------------------------------------------------------
# The apply step. Purely local — no network calls — so once we get here it
# either fully succeeds or fails for a reason retrying would not fix.
# ---------------------------------------------------------------------------
FIREWALL_APPLIED=0

apply_firewall() {
    # Build into a temp set and swap it in, so the live set is replaced
    # atomically and re-runs never trip over "set with the same name exists".
    ipset destroy allowed-domains-new 2>/dev/null || true
    ipset create allowed-domains-new hash:net
    while read -r entry; do
        [ -n "$entry" ] || continue
        ipset add -exist allowed-domains-new "$entry"
    done <"$ALLOWED_CIDRS"

    if ipset list -n allowed-domains >/dev/null 2>&1; then
        ipset swap allowed-domains-new allowed-domains
        ipset destroy allowed-domains-new
    else
        ipset rename allowed-domains-new allowed-domains
    fi

    # Flush only the FILTER table — our firewall lives entirely there. We
    # deliberately do NOT touch nat/mangle: flushing nat wipes Docker's
    # embedded-DNS redirect (127.0.0.11) and the save/restore workaround for that
    # is fragile and was leaving DNS resolution broken inside the container.
    # Leaving nat/mangle alone keeps Docker DNS (and sibling-service resolution
    # like `mongo`) working.
    iptables -F
    iptables -X

    # DNS. Docker's embedded resolver lives on 127.0.0.11 (reached over lo), but
    # allow 53 outright so a plain /etc/resolv.conf nameserver also works. TCP/53
    # matters for responses too large for UDP.
    iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
    iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT
    iptables -A INPUT -p udp --sport 53 -j ACCEPT

    # SSH out (git over ssh), plus loopback.
    iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT
    iptables -A INPUT -i lo -j ACCEPT
    iptables -A OUTPUT -o lo -j ACCEPT

    # The default route points at the compose bridge gateway, so this /24 covers
    # forwarded-port traffic coming back from the host, plus any sibling compose
    # service you add to docker-compose.yml (they land on the same bridge).
    local host_ip host_network
    host_ip=$(ip route | awk '/^default/ {print $3; exit}')
    if [ -n "$host_ip" ]; then
        host_network=$(echo "$host_ip" | sed "s/\.[0-9]*$/.0\/24/")
        log "host network detected as $host_network"
        iptables -A INPUT -s "$host_network" -j ACCEPT
        iptables -A OUTPUT -d "$host_network" -j ACCEPT
    else
        warn "could not detect the host network — sibling services (mongo) will be unreachable"
    fi

    # Established connections for already-approved traffic.
    iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
    iptables -A OUTPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

    # The allowlist itself.
    iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT

    # REJECT rather than DROP so blocked calls fail fast instead of hanging.
    iptables -A OUTPUT -j REJECT --reject-with icmp-admin-prohibited

    iptables -P INPUT DROP
    iptables -P FORWARD DROP
    iptables -P OUTPUT DROP

    # The allowlist is IPv4-only; without this, any host with an AAAA record
    # stays reachable and the whole policy is trivially bypassed.
    ip6tables -F
    ip6tables -X
    ip6tables -A INPUT -i lo -j ACCEPT
    ip6tables -A OUTPUT -o lo -j ACCEPT
    ip6tables -P INPUT DROP
    ip6tables -P FORWARD DROP
    ip6tables -P OUTPUT DROP

    FIREWALL_APPLIED=1
}

# Any unexpected failure during setup must still leave a firewall behind rather
# than a wide-open container.
on_error() {
    local rc=$?
    trap - ERR  # don't recurse if apply_firewall is what blew up
    warn "setup failed (exit $rc) — applying default-deny with the allowlist gathered so far"
    if [ "$FIREWALL_APPLIED" -eq 0 ]; then
        apply_firewall || warn "could not apply firewall rules"
    fi
    exit "$rc"
}
trap on_error ERR

# ---------------------------------------------------------------------------
# Phase 0 — open the box up so the lookups below can run.
# ---------------------------------------------------------------------------
# `iptables -F` clears rules but NOT the policy, so a lingering DROP from a
# previous run (postStartCommand runs on every container start) would otherwise
# block the DNS/GitHub lookups this script depends on.
iptables -F
iptables -X
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT
ip6tables -P INPUT ACCEPT
ip6tables -P OUTPUT ACCEPT

# ---------------------------------------------------------------------------
# Phase 1 — wait for DNS.
# ---------------------------------------------------------------------------
# postStartCommand fires the moment the container is up, which can be before
# Docker's embedded resolver (127.0.0.11) is answering.
#
# Every lookup below is explicitly time-boxed (`dig +time/+tries`, curl
# --max-time). This script runs on the critical path of every container start,
# so a dead resolver has to cost seconds, not the many minutes that dig's default
# timeouts add up to across ~25 domains.
#
# `dig +short` prints its diagnostics (";; no servers could be reached") to
# STDOUT, and exits 0 on an empty/NXDOMAIN answer — so the only reliable success
# check is "did we get something shaped like an IPv4 address back".
resolve_a() { dig +short +time=2 +tries=1 A "$1" 2>/dev/null | grep -E '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'; }

dns_up() { [ -n "$(resolve_a registry.npmjs.org)" ]; }

log "waiting for DNS..."
DNS_READY=1
if retry 10 1 dns_up; then
    log "DNS is up"
else
    DNS_READY=0
    warn "DNS still not resolving after ~20s — the allowlist will be incomplete"
fi

# ---------------------------------------------------------------------------
# Phase 2 — build the allowlist (nothing here touches iptables).
# ---------------------------------------------------------------------------

# The shared Turborepo remote cache. It lives on a second docker network, which
# the host-network /24 rule in apply_firewall does NOT cover — that one is
# derived from the default route, i.e. the devcontainer's own bridge. Pinned to
# this CIDR in .devcontainer/turbo-cache/docker-compose.yml; keep the two in sync.
# Without this, turbo's cache requests are REJECTed and every build falls back to
# local execution (slow, but not broken).
echo "172.30.0.0/24" >>"$ALLOWED_CIDRS"

# GitHub's stable published prefixes, used when api.github.com/meta is
# unreachable. The hostnames in ALLOWED_DOMAINS below cover the Azure-hosted
# endpoints (api.github.com et al.) that live outside these blocks.
GITHUB_FALLBACK_RANGES="192.30.252.0/22
185.199.108.0/22
140.82.112.0/20
143.55.64.0/20"

log "fetching GitHub IP ranges..."
gh_meta=$(mktemp)
gh_ranges=""
if [ "$DNS_READY" -eq 1 ] \
    && retry 2 2 curl -fsS --connect-timeout 5 --max-time 15 -o "$gh_meta" https://api.github.com/meta \
    && jq -e '.web and .api and .git' "$gh_meta" >/dev/null 2>&1; then
    gh_ranges=$(jq -r '(.web + .api + .git)[]' "$gh_meta" | grep -E '^[0-9.]+/[0-9]+$' | aggregate -q) || gh_ranges=""
fi
rm -f "$gh_meta"

if [ -z "$gh_ranges" ]; then
    warn "could not fetch api.github.com/meta — falling back to GitHub's static ranges"
    gh_ranges="$GITHUB_FALLBACK_RANGES"
fi

while read -r cidr; do
    [ -n "$cidr" ] || continue
    if [[ ! "$cidr" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/[0-9]{1,2}$ ]]; then
        warn "skipping invalid CIDR from GitHub meta: $cidr"
        continue
    fi
    echo "$cidr" >>"$ALLOWED_CIDRS"
done < <(echo "$gh_ranges")
log "collected $(wc -l <"$ALLOWED_CIDRS") GitHub ranges"

# A domain that fails to resolve warns and continues rather than aborting
# startup: the firewall still applies default-deny, just without that host.
ALLOWED_DOMAINS=(
    # GitHub — also listed by name so a failed meta fetch still leaves git usable.
    "github.com"
    "api.github.com"
    "codeload.github.com"
    "raw.githubusercontent.com"
    "objects.githubusercontent.com"
    # Node / yarn toolchain
    "registry.npmjs.org"
    "registry.yarnpkg.com"
    "repo.yarnpkg.com"
    "nodejs.org"
    # Deno
    "deno.land"
    "dl.deno.land"
    "jsr.io"
    # Meteor. The distribution itself is baked into the image (see the Dockerfile),
    # so static.meteor.com is only needed if the launcher ever bootstraps a fresh
    # warehouse; packages.meteor.com serves per-project package downloads.
    "install.meteor.com"
    "packages.meteor.com"
    "warehouse.meteor.com"
    "static.meteor.com"
    # Rocket.Chat's supported-versions check, polled on every server start.
    # Blocking it is not fatal but floods the dev log with FetchError stacks.
    "releases.rocket.chat"
	"marketplace.rocket.chat"
	"cloud.rocket.chat"
	"billing.rocket.chat"
	"collector.rocket.chat"
	"billing.staging.cloud.rocket.chat"
	"marketplace.staging.cloud.rocket.chat"
	"my.staging.cloud.rocket.chat"
    # Claude Code: auth, API, telemetry
    "api.anthropic.com"
    "console.anthropic.com"
    "claude.ai"
    "sentry.io"
    # Claude Code's telemetry host is statsig.anthropic.com, but that name has no
    # public A record; it lands on Statsig's CDN, which these two cover.
    "statsig.com"
    "featuregates.org"
    # VS Code server + extensions
    "marketplace.visualstudio.com"
    "vscode.blob.core.windows.net"
    "update.code.visualstudio.com"
)

if [ "$DNS_READY" -eq 0 ]; then
    warn "skipping domain resolution — no working resolver"
else
    unresolved=()
    for domain in "${ALLOWED_DOMAINS[@]}"; do
        ips=$(retry 2 1 resolve_a "$domain") || ips=""
        if [ -z "$ips" ]; then
            unresolved+=("$domain")
            continue
        fi
        while read -r ip; do
            [ -n "$ip" ] || continue
            echo "$ip" >>"$ALLOWED_CIDRS"
        done < <(echo "$ips")
    done

    if [ ${#unresolved[@]} -gt 0 ]; then
        # IFS is newline/tab, so join explicitly to keep this on one line.
        warn "could not resolve, skipping: $(IFS=,; echo "${unresolved[*]}")"
    fi
fi
log "allowlist contains $(wc -l <"$ALLOWED_CIDRS") entries"

# ---------------------------------------------------------------------------
# Phase 3 — apply.
# ---------------------------------------------------------------------------
apply_firewall
trap - ERR
log "firewall configuration complete"

# ---------------------------------------------------------------------------
# Phase 4 — verify. Only a leak is fatal; an expected-but-blocked host is a
# warning, so a flaky network can't turn every container start into a red error.
# ---------------------------------------------------------------------------
log "verifying firewall rules..."
if curl --connect-timeout 5 -sI https://example.com >/dev/null 2>&1; then
    die "verification failed — https://example.com is reachable, the firewall is not blocking"
fi
log "verified: https://example.com is blocked as expected"

for url in https://api.github.com/zen https://api.anthropic.com https://registry.npmjs.org/; do
    if curl --connect-timeout 5 -sI "$url" >/dev/null 2>&1; then
        log "verified: $url is reachable"
    else
        warn "$url is NOT reachable — tooling that needs it will fail"
    fi
done
