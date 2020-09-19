FROM node:12 as build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y build-essential git

# ADD ./moleculer.config.js .
ADD ./dist .
ADD ./package.json .

RUN npm install --production

FROM node:12-alpine

ARG SERVICE

WORKDIR /app

COPY --from=build /app .

ENV NODE_ENV=production

WORKDIR /app/ee/server/services/${SERVICE}

CMD ["node", "service.js"]
