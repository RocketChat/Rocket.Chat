FROM node:22.13.1-alpine3.20

ARG SERVICE

WORKDIR /app

COPY ./packages/core-services/package.json packages/core-services/package.json
COPY ./packages/core-services/dist packages/core-services/dist

COPY ./packages/apps-engine/package.json packages/apps-engine/package.json
COPY ./packages/apps-engine/client packages/apps-engine/client
COPY ./packages/apps-engine/definition packages/apps-engine/definition

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

COPY ./ee/packages/network-broker/package.json ee/packages/network-broker/package.json
COPY ./ee/packages/network-broker/dist ee/packages/network-broker/dist

COPY ./ee/packages/license/package.json packages/license/package.json
COPY ./ee/packages/license/dist packages/license/dist

COPY ./packages/random/package.json packages/random/package.json
COPY ./packages/random/dist packages/random/dist

COPY ./packages/sha256/package.json packages/sha256/package.json
COPY ./packages/sha256/dist packages/sha256/dist

COPY ./ee/packages/omnichannel-services/package.json ee/packages/omnichannel-services/package.json
COPY ./ee/packages/omnichannel-services/dist ee/packages/omnichannel-services/dist

COPY ./ee/packages/pdf-worker/package.json ee/packages/pdf-worker/package.json
COPY ./ee/packages/pdf-worker/dist ee/packages/pdf-worker/dist

COPY ./packages/tools/package.json packages/tools/package.json
COPY ./packages/tools/dist packages/tools/dist

COPY ./packages/tracing/package.json packages/tracing/package.json
COPY ./packages/tracing/dist packages/tracing/dist

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
    apk --no-cache --virtual deps add g++ python3 make py3-setuptools shadow && \
    yarn workspaces focus --production && \
    rm -rf /var/cache/apk/* && \
    groupmod -n rocketchat nogroup && \
    useradd -u 65533 -r -g rocketchat rocketchat && \
    apk del deps && \
    chown -R rocketchat:rocketchat /app

USER rocketchat

EXPOSE 3000 9458

CMD ["node", "src/service.js"]
