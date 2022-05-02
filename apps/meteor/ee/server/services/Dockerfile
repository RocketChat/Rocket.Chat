FROM node:14.18.3 as build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y build-essential git

COPY ./package.json .
COPY ./yarn.lock .
COPY ./.yarnrc.yml .
COPY ./.yarn/plugins .yarn/plugins
COPY ./.yarn/releases .yarn/releases

COPY ./packages/core-typings packages/core-typings
COPY ./packages/eslint-config packages/eslint-config
COPY ./packages/rest-typings packages/rest-typings

COPY ./apps/meteor/ee/server/services apps/meteor/ee/server/services

RUN yarn install

COPY ./tsconfig.base.json .

RUN yarn workspace @rocket.chat/core-typings run build \
    && yarn workspace @rocket.chat/rest-typings run build

FROM node:14.18.3-alpine

ARG SERVICE

WORKDIR /app

COPY --from=build /app/packages/core-typings/package.json /app/packages/core-typings/package.json
COPY --from=build /app/packages/core-typings/dist /app/packages/core-typings/dist

COPY --from=build /app/packages/rest-typings/package.json /app/packages/rest-typings/package.json
COPY --from=build /app/packages/rest-typings/dist /app/packages/rest-typings/dist

# add dist/ folder from tsc so we don't need to add all rocket.chat repo
COPY ./apps/meteor/ee/server/services/dist ./apps/meteor/

COPY ./package.json .
COPY ./yarn.lock .
COPY ./.yarnrc.yml .
COPY ./.yarn/plugins .yarn/plugins
COPY ./.yarn/releases .yarn/releases
COPY ./apps/meteor/ee/server/services/package.json ./apps/meteor/ee/server/services/package.json

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app/apps/meteor/ee/server/services
RUN yarn workspaces focus --production

WORKDIR /app/apps/meteor/ee/server/services/${SERVICE}

EXPOSE 3000 9458

CMD ["node", "service.js"]
