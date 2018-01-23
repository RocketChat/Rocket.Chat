FROM ubuntu:16.04 as builder

RUN apt update && apt install curl git bzip2 -y

RUN set -x \
&& curl https://install.meteor.com | sed s/--progress-bar/-sL/g | /bin/sh \
&& export PATH="$HOME/.meteor:$PATH"

COPY . /app

WORKDIR /app

RUN set -x \
&& meteor npm i --unsafe-perm

RUN set -x \
&& meteor build --allow-superuser --headless --directory /tmp/build

FROM rocketchat/base:4

ENV RC_VERSION 0.57.0-develop

MAINTAINER buildmaster@rocket.chat

COPY --from=builder /tmp/build/bundle /app/bundle

RUN set -x \
 && ls -l /app \
 && cd /app/bundle/programs/server \
 && npm install \
 && npm cache clear \
 && chown -R rocketchat:rocketchat /app

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
