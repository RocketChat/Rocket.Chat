FROM node:latest as build

WORKDIR /app

ADD ./server/src/ ./src

ADD package.json .

RUN npm install && \
    npm run build

FROM node:alpine

WORKDIR /app

COPY --from=build /app/lib/ .
ADD package.json .

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    TRANSPORTER=nats://nats:4222

EXPOSE 9100

RUN npm install
RUN npm prune --production

CMD ["node", "standalone.js"]
