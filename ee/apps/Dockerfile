FROM node:22.22.3-alpine3.23 AS builder

ARG SERVICE

RUN apk update && \
    apk --no-cache add g++ python3 make py3-setuptools

WORKDIR /app

# The build context is the pruned, self-contained subset produced by
# `turbo prune <service> --use-gitignore=false` (then node_modules/.turbo stripped).
# It already contains exactly this service's dependency closure: every in-scope
# workspace's package.json + built dist (+ generated files like apps-engine/definition),
# a pruned yarn.lock, and the workspace plumbing (.yarnrc.yml, .yarn/*).
COPY . .

ENV NODE_ENV=production

# The service's own compiled output is emitted monorepo-mirrored inside its dist
# (e.g. dist/ee/apps/<service>/src/service.js, dist/apps/meteor/... for cross-imports).
# Overlay it onto /app so the compiled entrypoint lands at its real path, matching
# `CMD node src/service.js` from the service workdir. Library packages keep their own
# (flat) packages/*/dist, resolved via each package.json "main".
RUN cp -a ee/apps/${SERVICE}/dist/. ./ && rm -rf ee/apps/${SERVICE}/dist

WORKDIR /app/ee/apps/${SERVICE}

RUN yarn workspaces focus --production

# `turbo prune` derives the closure from the *whole* workspace graph (incl. devDependencies)
# and copies each in-scope package's full tree (TS sources, sourcemaps, type decls). None of
# that is needed at runtime. Trim the build context to the production payload before it is
# baked into the final image: drop staged workspace packages the production install did not
# link (dev-only internal deps), library TS sources, sourcemaps, and type declarations.
RUN set -eu; cd /app; \
    # Packages the production install linked (node-modules linker symlinks them under
    # node_modules/@rocket.chat). This is the source of truth for "needed at runtime".
    keep="$(find node_modules/@rocket.chat -maxdepth 1 -type l -exec readlink -f {} \; | sed 's#^/app/##')"; \
    # Guard: never proceed with an empty keep-set (e.g. a PnP linker with no symlinks),
    # which would otherwise delete every workspace package below.
    [ -n "$keep" ] || { echo 'trim: no linked workspace packages found — aborting'; exit 1; }; \
    for d in packages/* ee/packages/*; do \
      if printf '%s\n' "$keep" | grep -qxF "$d"; then \
        # Kept package: drop its TS sources only when it ships a dist/ (its runtime entry).
        # Packages whose entry point lives in src/ (no dist) keep their sources.
        [ -d "$d/dist" ] && rm -rf "$d/src" || true; \
      else \
        rm -rf "$d"; \
      fi; \
    done; \
    find packages ee/packages ee/apps \( -name '*.js.map' -o -name '*.d.ts' \) -delete

FROM node:22.22.3-alpine3.23

ARG SERVICE

ENV NODE_ENV=production \
    PORT=3000

RUN apk update && \
    apk --no-cache --virtual deps add shadow && \
    # Update OpenSSL
    # CVE -> https://scout.docker.com/vulnerabilities/id/CVE-2025-9230?s=alpine&n=openssl&ns=alpine&t=apk&osn=alpine&osv=3.22
    apk upgrade --no-cache openssl && \
    rm -rf /var/cache/apk/* && \
    groupmod -n rocketchat nogroup && \
    useradd -u 65533 -r -g rocketchat rocketchat && \
    apk del deps

COPY --chown=rocketchat:rocketchat --from=builder /app /app

WORKDIR /app/ee/apps/${SERVICE}

USER rocketchat

EXPOSE 3000 9458

CMD ["node", "src/service.js"]
