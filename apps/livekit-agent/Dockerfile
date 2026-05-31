FROM node:20-slim AS build
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src
RUN corepack enable && yarn install --frozen-lockfile && yarn build

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist
RUN corepack enable && yarn install --production --frozen-lockfile
ENV NODE_ENV=production
# `start` here is the LK agents CLI subcommand — registers the worker with
# the LK server and waits for room-join dispatches.
CMD ["node", "--enable-source-maps", "dist/agent.js", "start"]
