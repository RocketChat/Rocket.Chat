FROM rocketchat/base:12.16.1

COPY --chown=rocketchat:rocketchat . /app

RUN set -x \
 && cd /app/bundle/programs/server \
 && npm install \
 && npm cache clear --force

USER rocketchat

VOLUME /app/uploads

WORKDIR /app/bundle

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    MONGO_OPLOG_URL=mongodb://mongo:27017/local \
    HOME=/tmp \
    PORT=3001 \
    ROOT_URL=http://localhost:3001 \
    INSTANCE_IP=127.0.0.1 \
    CREATE_TOKENS_FOR_USERS=true \
    Accounts_AvatarStorePath=/app/uploads

EXPOSE 3001

CMD ["node", "main.js"]
