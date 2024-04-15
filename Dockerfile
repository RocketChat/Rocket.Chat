FROM node:14.21.3

ENV NODE_ENV=production
ENV RC_VERSION=6.7.0

RUN groupadd -r rocketchat && \
    useradd -r -g rocketchat rocketchat && \
    mkdir -p /app/uploads && chown rocketchat:rocketchat /app/uploads

WORKDIR /app

COPY . .

RUN yarn
RUN yarn build


CMD ["yarn", "dsv"]
