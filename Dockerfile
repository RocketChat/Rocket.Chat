FROM node:14.21.3

ENV NODE_ENV=production
ENV RC_VERSION=6.7.0

RUN groupadd -r rocketchat && \
    useradd -r -g rocketchat rocketchat && \
    mkdir -p /app/uploads && chown rocketchat:rocketchat /app/uploads

RUN curl https://install.meteor.com/ | sh

RUN apt-get install -y libssl-dev

WORKDIR /app

COPY . .

RUN yarn
RUN yarn build

WORKDIR /app/apps/meteor

ENV METEOR_ALLOW_SUPERUSER=1

RUN yarn
RUN meteor build --directory ../output  

WORKDIR /app/apps/output/bundle
RUN yarn add fibers @meteorjs/reify

RUN apt-get install -y --no-install-recommends g++ make python3 ca-certificates

RUN cd /app/apps/output/bundle/programs/server && npm install
RUN cd /app/apps/output/bundle/programs/server/npm/node_modules/isolated-vm && npm install

ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

EXPOSE 3000

CMD ["node", "main.js"]
