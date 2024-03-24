FROM node:16

COPY . /app

WORKDIR /app

RUN npm install --production && npm run build

CMD ["node", "/app/dist"]
