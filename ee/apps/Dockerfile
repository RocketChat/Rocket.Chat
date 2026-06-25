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
