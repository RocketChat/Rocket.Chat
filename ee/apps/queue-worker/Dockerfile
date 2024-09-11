ARG DENO_VERSION="1.37.1"

FROM denoland/deno:alpine-${DENO_VERSION} as deno

FROM node:14.21.3-alpine3.16

ARG SERVICE

## Alpine 3.16 does not have a deno package, but newer versions have it
## So as soon as we can update the Alpine version, we can replace the following
## GLIBC installation part by an `apk add deno`

# Installing glibc deps required by Deno
# This replaces libc6-compat
# Copied from https://github.com/Docker-Hub-frolvlad/docker-alpine-glibc, which denoland/deno:alpine-1.37.1 uses
# NOTE: Glibc 2.35 package is broken: https://github.com/sgerrand/alpine-pkg-glibc/issues/176, so we stick to 2.34 for now
RUN ALPINE_GLIBC_BASE_URL="https://github.com/sgerrand/alpine-pkg-glibc/releases/download" && \
    ALPINE_GLIBC_PACKAGE_VERSION="2.34-r0" && \
    ALPINE_GLIBC_BASE_PACKAGE_FILENAME="glibc-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
    ALPINE_GLIBC_BIN_PACKAGE_FILENAME="glibc-bin-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
    ALPINE_GLIBC_I18N_PACKAGE_FILENAME="glibc-i18n-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
    apk add --no-cache --virtual=.build-dependencies wget ca-certificates ttf-dejavu && \
    echo \
        "-----BEGIN PUBLIC KEY-----\
        MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApZ2u1KJKUu/fW4A25y9m\
        y70AGEa/J3Wi5ibNVGNn1gT1r0VfgeWd0pUybS4UmcHdiNzxJPgoWQhV2SSW1JYu\
        tOqKZF5QSN6X937PTUpNBjUvLtTQ1ve1fp39uf/lEXPpFpOPL88LKnDBgbh7wkCp\
        m2KzLVGChf83MS0ShL6G9EQIAUxLm99VpgRjwqTQ/KfzGtpke1wqws4au0Ab4qPY\
        KXvMLSPLUp7cfulWvhmZSegr5AdhNw5KNizPqCJT8ZrGvgHypXyiFvvAH5YRtSsc\
        Zvo9GI2e2MaZyo9/lvb+LbLEJZKEQckqRj4P26gmASrZEPStwc+yqy1ShHLA0j6m\
        1QIDAQAB\
        -----END PUBLIC KEY-----" | sed 's/   */\n/g' > "/etc/apk/keys/sgerrand.rsa.pub" && \
    wget \
        "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_I18N_PACKAGE_FILENAME" && \
    mv /etc/nsswitch.conf /etc/nsswitch.conf.bak && \
    apk add --no-cache --force-overwrite \
        "$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_I18N_PACKAGE_FILENAME" && \
    \
    mv /etc/nsswitch.conf.bak /etc/nsswitch.conf && \
    rm "/etc/apk/keys/sgerrand.rsa.pub" && \
    (/usr/glibc-compat/bin/localedef --force --inputfile POSIX --charmap UTF-8 "$LANG" || true) && \
    echo "export LANG=$LANG" > /etc/profile.d/locale.sh && \
    \
    apk del glibc-i18n && \
    \
    rm "/root/.wget-hsts" && \
    apk del .build-dependencies && \
    rm \
        "$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_I18N_PACKAGE_FILENAME"

COPY --from=deno /bin/deno /bin/deno

WORKDIR /app

COPY ./packages/core-services/package.json packages/core-services/package.json
COPY ./packages/core-services/dist packages/core-services/dist

COPY ./packages/apps-engine/package.json packages/apps-engine/package.json
COPY ./packages/apps-engine/client packages/apps-engine/client
COPY ./packages/apps-engine/definition packages/apps-engine/definition
COPY ./packages/apps-engine/deno-runtime packages/apps-engine/deno-runtime
COPY ./packages/apps-engine/lib packages/apps-engine/lib
COPY ./packages/apps-engine/scripts packages/apps-engine/scripts
COPY ./packages/apps-engine/server packages/apps-engine/server

COPY ./packages/agenda/package.json packages/agenda/package.json
COPY ./packages/agenda/dist packages/agenda/dist

COPY ./packages/core-typings/package.json packages/core-typings/package.json
COPY ./packages/core-typings/dist packages/core-typings/dist

COPY ./packages/rest-typings/package.json packages/rest-typings/package.json
COPY ./packages/rest-typings/dist packages/rest-typings/dist

COPY ./packages/message-parser/package.json packages/message-parser/package.json
COPY ./packages/message-parser/dist packages/message-parser/dist
COPY ./packages/message-parser/messageParser.js packages/message-parser/messageParser.js

COPY ./packages/peggy-loader/package.json packages/peggy-loader/package.json
COPY ./packages/peggy-loader/dist packages/peggy-loader/dist

COPY ./packages/model-typings/package.json packages/model-typings/package.json
COPY ./packages/model-typings/dist packages/model-typings/dist

COPY ./packages/jwt/package.json packages/jwt/package.json
COPY ./packages/jwt/dist packages/jwt/dist

COPY ./packages/models/package.json packages/models/package.json
COPY ./packages/models/dist packages/models/dist

COPY ./packages/logger/package.json packages/logger/package.json
COPY ./packages/logger/dist packages/logger/dist

COPY ./packages/server-cloud-communication/ packages/server-cloud-communication/

COPY ./ee/packages/license/package.json packages/license/package.json
COPY ./ee/packages/license/dist packages/license/dist

COPY ./ee/packages/omnichannel-services/package.json ee/packages/omnichannel-services/package.json
COPY ./ee/packages/omnichannel-services/dist ee/packages/omnichannel-services/dist

COPY ./ee/packages/pdf-worker/package.json ee/packages/pdf-worker/package.json
COPY ./ee/packages/pdf-worker/dist ee/packages/pdf-worker/dist

COPY ./packages/tools/package.json packages/tools/package.json
COPY ./packages/tools/dist packages/tools/dist

COPY ./packages/ui-kit/package.json packages/ui-kit/package.json
COPY ./packages/ui-kit/dist packages/ui-kit/dist

COPY ./ee/apps/${SERVICE}/dist .

COPY ./package.json .
COPY ./yarn.lock .
COPY ./.yarnrc.yml .
COPY ./.yarn/plugins .yarn/plugins
COPY ./.yarn/releases .yarn/releases
COPY ./.yarn/patches .yarn/patches
COPY ./ee/apps/${SERVICE}/package.json ee/apps/${SERVICE}/package.json

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app/ee/apps/${SERVICE}

RUN apk update && \
    apk --no-cache --virtual build-dependencies add g++ python3 make && \
    yarn workspaces focus --production && \
    rm -rf /var/cache/apk/* && \
    apk del build-dependencies

EXPOSE 3000 9458

CMD ["node", "src/service.js"]
