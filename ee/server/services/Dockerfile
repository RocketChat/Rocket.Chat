FROM node:12 as build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y build-essential git

ADD ./package.json .

RUN npm install --production

FROM node:12-alpine

ARG SERVICE

WORKDIR /app

COPY --from=build /app .

ADD ./dist .

ENV NODE_ENV=production
ENV PORT=80

WORKDIR /app/ee/server/services/${SERVICE}

EXPOSE 9458
EXPOSE 80

CMD ["node", "service.js"]
