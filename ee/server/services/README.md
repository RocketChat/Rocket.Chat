# Rocket.Chat Micro-Services

## PM2

This usually suits better for development purposes.

Start NATS first, you can it via Docker:

```
docker run --rm -d -p 4222:4222 nats
```

Then run Rocket.Chat as usual with an additional `TRANSPORTER` and `DISABLE_DB_WATCH` env vars:

```
TRANSPORTER=nats://localhost:4222 MOLECULER_LOG_LEVEL=debug DISABLE_DB_WATCH=true meteor
```

Set up an Enterprise license going to Admin > Enterprise.

Then you can spin up micro services. From this folder, first install dependencies:

```
meteor npm i
```

You can run on `dev` to have hot reloading:

```
MONGO_URL=mongodb://localhost:3001/meteor \
MOLECULER_LOG_LEVEL=debug \
TRANSPORTER=nats://localhost:4222 \
meteor npm run dev
```

To see process logs, do:

```
meteor npm run pm2 -- logs
```

## Docker Compose

The `.env` file defines the HTTP address to be used, default to `localhost`.

It requires meteor to be running, and the config at `services/.config/services/service.env` uses the default meteor mongodb. To run it:

```
TRANSPORTER=nats://localhost:4222 MOLECULER_LOG_LEVEL=debug meteor
```

The `docker-compose.yml` file contais a setup of the micro-services plus some extra tools:

### Traefik
It's used to route the the domain on port 80 to the **DDP Streamer Service** and expose these addresses
* `traefik.localhost` as Traefik admin
* `prometheus.localhost` as Prometheus admin
* `grafana.localhost` as Grafana dashboards

### Prometheus
Used to collect metrics from the micro-services

### Grafana
Used to expose metrics from prometheus as dashboards

### Nats
Used for the communication of the microservices

## Build containers
`npm run build-containers` will build the typescript files and generate the containers

## Running with docker-compose
`docker-compose up --remove-orphans` will run all the micro-services, still need to run MongoDB and Rocket.Chat Core separated

### Running rocket.chat core
`MONGO_URL=mongodb://localhost:27017/rocketchat MONGO_OPLOG_URL=mongodb://localhost:27017/local TRANSPORTER=nats://localhost:4222 MOLECULER_LOG_LEVEL=debug meteor`
