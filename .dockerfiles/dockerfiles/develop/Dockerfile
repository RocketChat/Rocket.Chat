FROM node:0.10

MAINTAINER buildmaster@rocket.chat

RUN apt-get update \
&&  apt-get install -y graphicsmagick \
&&  rm -rf /var/lib/apt/lists/*

RUN groupadd -r rocketchat \
&&  useradd -r -g rocketchat rocketchat \
&&  mkdir /app  \
&&  mkdir /app/uploads

# gpg: key 4FD08014: public key "Rocket.Chat Buildmaster <buildmaster@rocket.chat>" imported
RUN gpg --keyserver ha.pool.sks-keyservers.net --recv-keys 0E163286C20D07B9787EBE9FD7F9D0414FD08104

WORKDIR /app

RUN curl -fSL "https://s3.amazonaws.com/rocketchatbuild/develop.rocket.chat-v.latest.tgz" -o rocket.chat.tgz \
&&  tar zxvf ./rocket.chat.tgz \
&&  rm ./rocket.chat.tgz  \
&&  cd /app/bundle/programs/server \
&&  npm install

USER rocketchat

VOLUME /app/uploads
WORKDIR /app/bundle

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV MONGO_URL=mongodb://mongo:27017/rocketchat \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

EXPOSE 3000
CMD ["node", "main.js"]
