FROM rocketchat/base:8

ENV RC_VERSION 0.65.0-develop

MAINTAINER buildmaster@rocket.chat

RUN set -x \
 && curl -SLf "https://releases.rocket.chat/${RC_VERSION}/download/" -o rocket.chat.tgz \
 && curl -SLf "https://releases.rocket.chat/${RC_VERSION}/asc" -o rocket.chat.tgz.asc \
 && gpg --verify rocket.chat.tgz.asc \
 && mkdir -p /app \
 && tar -zxf rocket.chat.tgz -C /app \
 && rm rocket.chat.tgz rocket.chat.tgz.asc \
 && cd /app/bundle/programs/server \
 && npm install \
 && npm cache clear --force \
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

USER root

ENV MONGO_URL=mongodb://localhost:27017/rocketchat

RUN set -x \
 && apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5 \
 && echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.6 main" | tee /etc/apt/sources.list.d/mongodb-org-3.6.list \
 && apt-get update \
 && apt-get install -y --force-yes pwgen mongodb-org \
 && echo "mongodb-org hold" | dpkg --set-selections \
 && echo "mongodb-org-server hold" | dpkg --set-selections \
 && echo "mongodb-org-shell hold" | dpkg --set-selections \
 && echo "mongodb-org-mongos hold" | dpkg --set-selections \
 && echo "mongodb-org-tools hold" | dpkg --set-selections

ADD entrypoint.sh .

RUN chmod +x /app/bundle/entrypoint.sh

ENTRYPOINT /app/bundle/entrypoint.sh
