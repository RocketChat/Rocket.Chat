FROM node:20.15.1-alpine

ARG SERVICE

WORKDIR /app

COPY ./packages/core-services/package.json packages/core-services/package.json
COPY ./packages/core-services/dist packages/core-services/dist

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
    apk --no-cache --virtual build-dependencies add g++ python3 make py3-setuptools && \
    yarn workspaces focus --production && \
    rm -rf /var/cache/apk/* && \
    apk del build-dependencies

EXPOSE 3000 9458

CMD ["node", "src/service.js"]
