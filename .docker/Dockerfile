FROM rocketchat/base:4

ENV RC_VERSION 0.59.0-develop

MAINTAINER buildmaster@rocket.chat

COPY bundle /tmp/bundle

RUN set -x \
 && mkdir /app \
 && mkdir -p /app \
 && cp -r /tmp/bundle /app/bundle \
 && echo "/app/bundle dir was created" \
 && cd /app/bundle/programs/server \
 && npm install \
 && npm cache clear \
 && chown -R rocketchat:rocketchat /app \
 && echo "Rocket.chat docker build process finished successfully"

USER root

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
