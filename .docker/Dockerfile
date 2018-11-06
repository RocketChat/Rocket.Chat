FROM node:8.12-alpine

RUN apk add python make g++ libc6-compat ttf-dejavu

ADD . /app

MAINTAINER buildmaster@rocket.chat

RUN set -x \
 && cd /app/bundle/programs/server \
 && npm install \
 # Start hack for sharp...
 && rm -rf npm/node_modules/sharp \
 && rm -rf npm/node_modules/grpc \
 && npm install sharp@0.21.0 \
 && npm install grpc@1.12.2 \
 && mv node_modules/sharp npm/node_modules/sharp \
 && mv node_modules/grpc npm/node_modules/grpc \
 # End hack for sharp
 && cd npm \
 && npm rebuild bcrypt --build-from-source \
 && npm cache clear --force

# needs a mongo instance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

VOLUME /app/uploads

WORKDIR /app/bundle

EXPOSE 3000

CMD ["node", "main.js"]
