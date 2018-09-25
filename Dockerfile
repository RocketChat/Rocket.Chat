FROM node:8.11-jessie

MAINTAINER simon@divby0.io

# meteor installer doesn't work with the default tar binary
RUN apt-get update \
    && apt-get install -y bsdtar \
    && cp $(which tar) $(which tar)~ \
    && ln -sf $(which bsdtar) $(which tar)

# install Meteor forcing its progress
RUN curl "https://install.meteor.com/" \
    | sed 's/VERBOSITY="--silent"/VERBOSITY="--progress-bar"/' \
    | sh

# put back the original tar
RUN mv $(which tar)~ $(which tar)

ADD . /build

WORKDIR /build

RUN meteor npm install
RUN meteor build --server-only --allow-superuser --directory /app

RUN groupadd -r rocketchat \
&&  useradd -r -g rocketchat rocketchat \
&&  mkdir -p /app/uploads \
&&  chown rocketchat.rocketchat /app/uploads

VOLUME /app/uploads

WORKDIR /app/bundle
RUN cd programs/server &&  npm install

USER rocketchat

# needs a mongoinstance - defaults to container linking with alias 'db'
ENV DEPLOY_METHOD=docker-official \
    MONGO_URL=mongodb://db:27017/meteor \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

EXPOSE 3000

CMD ["node", "main.js"]
