FROM rocketchat/base:4

MAINTAINER buildmaster@rocket.chat

ADD /tmp/build /app

ENV RC_VERSION 0.57.0-designpreview \
    DEPLOY_METHOD=docker \
    NODE_ENV=production \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \

RUN set -x \
 && cd /app/bundle/programs/server \
 && npm install \
 && npm cache clear

WORKDIR /app/bundle

EXPOSE 3000

CMD ["node", "main.js"]
