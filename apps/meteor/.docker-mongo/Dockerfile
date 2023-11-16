ARG MONGO_VERSION=5.0.5

FROM mongo:$MONGO_VERSION

FROM node:14.21.3-bullseye-slim

LABEL maintainer="buildmaster@rocket.chat"

RUN set -x \
    && apt-get update \
    && apt-get install -y wget gnupg dirmngr pwgen fontconfig libcurl4 \
    && apt-get clean my room \
    && groupadd -g 65533 -r rocketchat \
    && useradd -u 65533 -r -g rocketchat rocketchat \
    && mkdir -p /app/uploads \
    && chown rocketchat:rocketchat /app/uploads

# --chown requires Docker 17.12 and works only on Linux
ADD --chown=rocketchat:rocketchat . /app
ADD --chown=rocketchat:rocketchat entrypoint.sh /app/bundle/

RUN aptMark="$(apt-mark showmanual)" \
    && apt-get install -y --no-install-recommends g++ make python ca-certificates \
    && cd /app/bundle/programs/server \
    && npm install \
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

COPY --from=0 /usr/bin/mongo* /usr/bin

VOLUME /app/uploads

WORKDIR /app/bundle

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker-preview \
    NODE_ENV=production \
    MONGO_URL=mongodb://localhost:27017/rocketchat \
    MONGO_OPLOG_URL=mongodb://localhost:27017/local \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

EXPOSE 3000

RUN chmod +x /app/bundle/entrypoint.sh

ENTRYPOINT /app/bundle/entrypoint.sh