FROM node:14.19.3-bullseye-slim

LABEL maintainer="buildmaster@rocket.chat"

# Install MongoDB and dependencies
ENV MONGO_MAJOR=5.0 \
    MONGO_VERSION=5.0.5

RUN set -x \
    && apt-get update \
    && apt-get install -y wget gnupg dirmngr pwgen \
    && wget -qO - "https://www.mongodb.org/static/pgp/server-$MONGO_MAJOR.asc" | apt-key add - \
    && echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/$MONGO_MAJOR main" | tee "/etc/apt/sources.list.d/mongodb-org-$MONGO_MAJOR.list" \
    && apt-get update \
    && apt-get install -y \
    mongodb-org=$MONGO_VERSION \
    mongodb-org-server=$MONGO_VERSION \
    mongodb-org-shell=$MONGO_VERSION \
    mongodb-org-mongos=$MONGO_VERSION \
    mongodb-org-tools=$MONGO_VERSION \
    fontconfig \
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
