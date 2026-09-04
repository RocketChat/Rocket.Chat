#!/usr/bin/env bash
#
# Runs on the HOST from gh/initialize.sh, before the container is created.
#
# Creates the named volume that holds your GitHub authentication: the gh CLI's
# config (hosts.yml carries the OAuth token) and the SSH key `gh auth login`
# generates and uploads. Two subdirectories, each mounted at its *canonical*
# path in the container by the compose fragment in gh/initialize.sh:
#
#   gh/   -> /home/vscode/.config/gh
#   ssh/  -> /home/vscode/.ssh
#
# Canonical paths on purpose: nothing then needs configuring: gh looks in
# ~/.config/gh, ssh looks in ~/.ssh, and a `gh auth login` run inside any
# container writes its new key straight into the shared volume. An IdentityFile
# indirection would work for ssh but not for gh's keygen, which is hardcoded to
# $HOME/.ssh with no flag or env var to move it.
#
# Compose will not create a missing external volume — it refuses to create the
# container at all — so this has to run on the host before create, not from a
# container-side hook. The two subdirectories have the same constraint for a
# second reason: a subpath mount fails if the path does not already exist in the
# volume ("cannot access path ...: no such file or directory"), and Docker will
# not create it. See gh/initialize.sh for why the volume is external.
#
# No docker-availability guard, unlike ensure-turbo-cache.sh: without docker
# there is no container either way, and `docker volume create`'s own error is
# clearer than anything invented here.
#
# Idempotent: this runs on every create/rebuild in every worktree, and all but
# the first return at the check below.
set -euo pipefail

volume="rc-devcontainer-gh-auth"
# The container runs as remoteUser vscode, whose uid devcontainers matches to the
# host user's so bind-mounted files stay writable — so seeding from the host uid
# is what makes the volume land owned by the right user in there. Compose has no
# chown, so a throwaway busybox does it — same trick as the turbo-cache stack's
# init service.
uid=$(id -u)

log() { printf '\033[1;34m[gh-auth]\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[gh-auth] WARNING:\033[0m %s\n' "$1" >&2; }

if docker volume inspect "$volume" >/dev/null 2>&1; then
	exit 0
fi

docker volume create "$volume" >/dev/null
# 0700 on both: one holds an OAuth token, the other a private key — and ssh
# refuses to use a key whose permissions are too open.
docker run --rm -v "$volume":/v busybox:1.37 \
	sh -c "mkdir -p /v/gh /v/ssh && chown -R $uid:$uid /v && chmod 700 /v/gh /v/ssh"

# Pre-seed github.com's host keys so git over ssh works in a fresh container
# without the "authenticity of host ... can't be established" prompt (and
# without weakening StrictHostKeyChecking to paper over it).
#
# Taken from api.github.com/meta over HTTPS, i.e. verified by GitHub's TLS
# certificate rather than trusted-on-first-use like ssh-keyscan would be. Purely
# a convenience, so every failure path here is a warning: ssh still works, it
# just asks once. jq is checked because this is the host, where it is not a
# given — inside the container init-firewall.sh already requires it.
if ! command -v jq >/dev/null || ! command -v curl >/dev/null; then
	warn "curl/jq not found — skipping known_hosts seed; ssh will ask to confirm github.com's key on first use"
elif ! keys=$(curl -fsS --connect-timeout 5 --max-time 15 https://api.github.com/meta |
	jq -er '.ssh_keys[] | "github.com \(.)"') || [ -z "$keys" ]; then
	warn "could not fetch github.com host keys — ssh will ask to confirm them on first use"
else
	printf '%s\n' "$keys" | docker run --rm -i -v "$volume":/v busybox:1.37 \
		sh -c "cat >/v/ssh/known_hosts && chown $uid:$uid /v/ssh/known_hosts"
	log "seeded github.com host keys into known_hosts"
fi

log "created shared volume $volume — run \`gh auth login\` once, in any worktree"
