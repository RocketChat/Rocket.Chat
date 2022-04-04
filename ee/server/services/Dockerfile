FROM node:14 as build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y build-essential git

ADD ./package.json .

RUN npm install --production

FROM node:14-alpine

ARG SERVICE

WORKDIR /app

COPY --from=build /app .

# add dist/ folder from tsc so we don't need to add all rocket.chat repo
ADD ./dist .

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app/ee/server/services/${SERVICE}

EXPOSE 3000 9458

CMD ["node", "service.js"]
