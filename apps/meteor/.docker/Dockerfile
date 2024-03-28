FROM node:14.21.3-bullseye-slim as builder

WORKDIR /app

RUN set -x \
    && apt-get update \
    && apt-get install -y --no-install-recommends g++ make python ca-certificates
    
RUN set -x \
    && cd /app \
    && npm install sharp@0.30.4 isolated-vm@4.4.2 bcrypt@5.0.1

FROM node:14.21.3-bullseye-slim

LABEL maintainer="buildmaster@rocket.chat"

RUN groupadd -g 65533 -r rocketchat \
    && useradd -u 65533 -r -g rocketchat rocketchat \
    && mkdir -p /app/uploads \
    && chown rocketchat:rocketchat /app/uploads \
    && apt-get update \
    && apt-get install -y --no-install-recommends fontconfig

ADD ./bundle/programs/server/package.json /app/bundle/programs/server/package.json

RUN set -x \
    && cd /app/bundle/programs/server \
    && npm install --production

# --chown requires Docker 17.12 and works only on Linux
ADD --chown=rocketchat:rocketchat . /app

COPY --from=builder /app/node_modules/sharp /app/bundle/programs/server/npm/node_modules/sharp
COPY --from=builder /app/node_modules/isolated-vm /app/bundle/programs/server/npm/node_modules/isolated-vm
COPY --from=builder /app/node_modules/bcrypt /app/bundle/programs/server/npm/node_modules/bcrypt

USER rocketchat

VOLUME /app/uploads

WORKDIR /app/bundle

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

EXPOSE 3000

CMD ["node", "main.js"]
