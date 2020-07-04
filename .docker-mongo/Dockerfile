FROM rocketchat/base:12.16.1

LABEL maintainer="buildmaster@rocket.chat"

RUN set -x \
 && apt-get update \
 && apt-get install -y wget \
 && wget -qO - https://www.mongodb.org/static/pgp/server-4.0.asc | apt-key add - \
 && echo "deb http://repo.mongodb.org/apt/debian stretch/mongodb-org/4.0 main" | tee /etc/apt/sources.list.d/mongodb-org-4.0.list \
 && apt-get update \
 && apt-get install -y pwgen mongodb-org \
 && apt-get clean my room

ADD . /app
ADD entrypoint.sh /app/bundle/

RUN set -x \
 && cd /app/bundle/programs/server \
 && npm install \
 && npm cache clear --force \
 && chown -R rocketchat:rocketchat /app

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
