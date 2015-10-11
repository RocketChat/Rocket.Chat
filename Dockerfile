FROM node:0.10

MAINTAINER buildmaster@rocket.chat 

RUN groupadd -r rocketchat \
&&  useradd -r -g rocketchat rocketchat \
&&  mkdir /app

# gpg: key 4FD08014: public key "Rocket.Chat Buildmaster <buildmaster@rocket.chat>" imported
RUN gpg --keyserver ha.pool.sks-keyservers.net --recv-keys 0E163286C20D07B9787EBE9FD7F9D0414FD08104

WORKDIR /app

RUN curl -fSL "https://s3.amazonaws.com/rocketchatbuild/rocket.chat-v.latest.tgz" -o rocket.chat.tgz \
&&  tar zxvf ./rocket.chat.tgz \
&&  rm ./rocket.chat.tgz  \
&&  cd /app/bundle/programs/server \
&&  npm install

WORKDIR /app/bundle
USER rocketchat

# needs a mongoinstance - defaults to container linking with alias 'db' 
ENV MONGO_URL=mongodb://db:27017/meteor \
    PORT=3000 \
    ROOT_URL=http://localhost:3000

EXPOSE 3000
CMD ["node", "main.js"]
