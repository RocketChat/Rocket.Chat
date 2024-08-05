FROM node:20.15.1 as build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y build-essential git

COPY ./package.json .
COPY ./yarn.lock .
COPY ./.yarnrc.yml .
COPY ./.yarn/plugins .yarn/plugins
COPY ./.yarn/releases .yarn/releases
COPY ./.yarn/patches .yarn/patches

COPY ./packages/core-services packages/core-services
COPY ./packages/core-typings packages/core-typings
COPY ./packages/eslint-config packages/eslint-config
COPY ./packages/rest-typings packages/rest-typings
COPY ./packages/model-typings packages/model-typings
COPY ./packages/models packages/models

COPY ./apps/meteor/ee/server/services apps/meteor/ee/server/services

RUN yarn install

COPY ./tsconfig.base.json .

RUN yarn workspace @rocket.chat/core-typings run build \
    && yarn workspace @rocket.chat/rest-typings run build

FROM node:20.15.1-alpine

ARG SERVICE

WORKDIR /app

COPY --from=build /app/packages/core-services/package.json /app/packages/core-services/package.json
COPY --from=build /app/packages/core-services/dist /app/packages/core-services/dist

COPY --from=build /app/packages/core-typings/package.json /app/packages/core-typings/package.json
COPY --from=build /app/packages/core-typings/dist /app/packages/core-typings/dist

COPY --from=build /app/packages/rest-typings/package.json /app/packages/rest-typings/package.json
COPY --from=build /app/packages/rest-typings/dist /app/packages/rest-typings/dist

COPY --from=build /app/packages/model-typings/package.json /app/packages/model-typings/package.json
COPY --from=build /app/packages/model-typings/dist /app/packages/model-typings/dist

COPY --from=build /app/packages/models/package.json /app/packages/models/package.json
COPY --from=build /app/packages/models/dist /app/packages/models/dist

COPY --from=build /app/packages/ui-kit/package.json /app/packages/ui-kit/package.json
COPY --from=build /app/packages/ui-kit/dist /app/packages/ui-kit/dist

# add dist/ folder from tsc so we don't need to add all rocket.chat repo
COPY ./apps/meteor/ee/server/services/dist ./apps/meteor/

COPY ./package.json .
COPY ./yarn.lock .
COPY ./.yarnrc.yml .
COPY ./.yarn/plugins .yarn/plugins
COPY ./.yarn/releases .yarn/releases
COPY ./.yarn/patches .yarn/patches
COPY ./apps/meteor/ee/server/services/package.json ./apps/meteor/ee/server/services/package.json

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app/apps/meteor/ee/server/services

RUN apk update && \
    apk --no-cache --virtual build-dependencies add g++ python3 make py3-setuptools && \
    yarn workspaces focus --production && \
    rm -rf /var/cache/apk/* && \
    apk del build-dependencies

WORKDIR /app/apps/meteor/ee/server/services/${SERVICE}

EXPOSE 3000 9458

CMD ["node", "service.js"]
