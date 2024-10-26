FROM node:20.18.0-alpine3.20

LABEL maintainer="buildmaster@rocket.chat"

ENV LANG=C.UTF-8

RUN apk add --no-cache deno ttf-dejavu

ADD . /app

# needs a mongo instance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

RUN set -x \
    && apk add --no-cache --virtual .fetch-deps python3 make g++ py3-setuptools libc6-compat \
    && cd /app/bundle/programs/server \
    && npm install --omit=dev --unsafe-perm \
    # Start hack for sharp...
    && rm -rf npm/node_modules/sharp \
    && npm install sharp@0.32.6 \
    && mv node_modules/sharp npm/node_modules/sharp \
    # End hack for sharp
    # # Start hack for isolated-vm...
    # && rm -rf npm/node_modules/isolated-vm \
    # && npm install isolated-vm@4.6.0 \
    # && mv node_modules/isolated-vm npm/node_modules/isolated-vm \
    # # End hack for isolated-vm
    && cd /app/bundle/programs/server/npm \
    && npm rebuild bcrypt --build-from-source \
    && npm cache clear --force \
    && apk del .fetch-deps

VOLUME /app/uploads

WORKDIR /app/bundle

EXPOSE 3000

CMD ["node", "main.js"]
