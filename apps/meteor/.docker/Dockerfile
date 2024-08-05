FROM node:20.15.1-bullseye-slim

LABEL maintainer="buildmaster@rocket.chat"

# dependencies
RUN groupadd -g 65533 -r rocketchat \
    && useradd -u 65533 -r -g rocketchat rocketchat \
    && mkdir -p /app/uploads \
    && chown rocketchat:rocketchat /app/uploads \
    && apt-get update \
    && apt-get install -y --no-install-recommends fontconfig

# --chown requires Docker 17.12 and works only on Linux
ADD --chown=rocketchat:rocketchat . /app

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads \
    DENO_DIR=/usr/share/deno

RUN aptMark="$(apt-mark showmanual)" \
    && apt-get install -y --no-install-recommends g++ make python3 ca-certificates \
    && cd /app/bundle/programs/server \
    && npm install \
    && cd npm/node_modules/isolated-vm \
    && npm install \
    && cd /app/bundle/programs/server/npm/node_modules/@rocket.chat/apps-engine/deno-runtime \
    && ../../../deno-bin/bin/deno cache main.ts \
    && apt-mark auto '.*' > /dev/null \
    && apt-mark manual $aptMark > /dev/null \
    && find /usr/local -type f -executable -exec ldd '{}' ';' \
    | awk '/=>/ { print $(NF-1) }' \
    | sort -u \
    | xargs -r dpkg-query --search \
    | cut -d: -f1 \
    | sort -u \
    | xargs -r apt-mark manual \
    && apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    && npm cache clear --force

USER rocketchat

VOLUME /app/uploads

WORKDIR /app/bundle

EXPOSE 3000

CMD ["node", "main.js"]
