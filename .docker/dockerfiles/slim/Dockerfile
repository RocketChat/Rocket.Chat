FROM debian:jessie

# IMPORTANT - FOR TESTING ONLY - DO NOT USE THIS FOR DEVELOPMENT OR PRODUCTION!
MAINTAINER buildmaster@rocket.chat

# gpg: key 4FD08014: public key "Rocket.Chat Buildmaster <buildmaster@rocket.chat>" imported
RUN gpg --keyserver ha.pool.sks-keyservers.net --recv-keys 0E163286C20D07B9787EBE9FD7F9D0414FD08104

# gpg keys listed at https://github.com/nodejs/node
RUN set -ex \
 && for key in \
      9554F04D7259F04124DE6B476D5A82AC7E37093B \
      94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
      0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
      FD3A5288F042B6850C66B31F09FE44734EB7990E \
      71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
      DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
      B9AE9905FFD7803F25714661B63B535A4C206CA9 \
      C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    ; do \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
    done

ENV NODE_VERSION 0.10.42
ENV NPM_VERSION 2.14.1
ENV RC_VERSION develop

VOLUME /app/uploads

RUN buildDeps='curl ca-certificates imagemagick' \
 && set -x \
 && apt-get update && apt-get install -y $buildDeps --no-install-recommends \

 && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz" \
 && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
 && gpg --verify SHASUMS256.txt.asc \
 && grep " node-v$NODE_VERSION-linux-x64.tar.gz\$" SHASUMS256.txt.asc | sha256sum -c - \
 && tar -xzf "node-v$NODE_VERSION-linux-x64.tar.gz" -C /usr/local --strip-components=1 \
 && rm "node-v$NODE_VERSION-linux-x64.tar.gz" SHASUMS256.txt.asc \
 && npm install -g npm@"$NPM_VERSION" \

 && groupadd -r rocketchat \
 && useradd -r -g rocketchat rocketchat
 && curl -SLf "https://rocket.chat/releases/${RC_VERSION}/download" -o rocket.chat.tgz \
 && curl -SLf "https://rocket.chat/releases/${RC_VERSION}/asc" -o rocket.chat.tgz.asc \
 && gpg --verify rocket.chat.tgz.asc \
 && tar -zxf rocket.chat.tgz -C /app \
 && rm rocket.chat.tgz rocket.chat.tgz.asc \
 && cd /app/bundle/programs/server \
 && npm install

 && rm -rf /var/lib/apt/lists/* \
 && npm cache clear
# && apt-get purge -y --auto-remove $buildDeps \

USER rocketchat

WORKDIR /app/bundle

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV MONGO_URL=mongodb://mongo:27017/rocketchat \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

EXPOSE 3000

CMD ["node", "main.js"]
