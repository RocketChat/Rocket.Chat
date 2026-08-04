#!/usr/bin/env bash
#
# Runs IN THE CONTAINER from scripts/update-content.sh, after `yarn install`, and
# only when devcontainer.json declares the playwright-deps feature (feature.id).
#
# Downloads the browser builds into the shared cache volume mounted at
# ~/.cache/ms-playwright. The feature installs the OS libraries those builds need;
# it deliberately does not install Playwright itself, which the repo already pins
# as a devDependency of apps/meteor.
#
# Why this is a script and not the feature's job: the download has to come from
# the *pinned* Playwright, since a browser build only works with the version that
# fetched it. `yarn workspace ... playwright` resolves @playwright/test from
# apps/meteor's package.json, so the browsers always match `yarn test:e2e` with no
# second version to bump — the same reason the Dockerfile reads its pins out of the
# repo. The features that do offer to install browsers pull in their own
# devcontainers/features/node, which would shadow the Volta-managed Node this image
# pins.
#
# CI does the equivalent in .github/actions/setup-playwright (`playwright install
# --with-deps`, cached on ~/.cache/ms-playwright); here the deps half is the
# feature and the volume is the cache.
set -euo pipefail

# Only chromium: playwright.config.ts runs `channel: 'chromium'` and the
# federation config inherits the default, so firefox and webkit builds would be
# dead weight — which is also why the feature's installFirefoxDeps/installWebkitDeps
# are off in devcontainer.json. Flip both together if you need another engine.
browsers=(chromium)

log() { printf '\033[1;34m[update-content:playwright]\033[0m %s\n' "$1"; }

log "installing browsers: ${browsers[*]}"
# No --with-deps: that shells out to apt, which the egress firewall does not
# allowlist, and the feature has already installed the same packages at build
# time. A no-op once the build is in the cache volume.
yarn workspace @rocket.chat/meteor playwright install "${browsers[@]}"
