FROM node:14.18.3-alpine

ARG SERVICE

WORKDIR /app

COPY ./packages/core-typings/package.json packages/core-typings/package.json
COPY ./packages/core-typings/dist packages/core-typings/dist
COPY ./packages/rest-typings/package.json packages/rest-typings/package.json
COPY ./packages/rest-typings/dist packages/rest-typings/dist
COPY ./packages/ui-contexts/package.json packages/ui-contexts/package.json
COPY ./packages/ui-contexts/dist packages/ui-contexts/dist

COPY ./ee/apps/${SERVICE}/dist .

COPY ./package.json .
COPY ./yarn.lock .
COPY ./.yarnrc.yml .
COPY ./.yarn/plugins .yarn/plugins
COPY ./.yarn/releases .yarn/releases
COPY ./ee/apps/${SERVICE}/package.json ee/apps/${SERVICE}/package.json

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app/ee/apps/${SERVICE}

RUN yarn workspaces focus --production

EXPOSE 3000 9458

CMD ["node", "src/service.js"]
