# Rocket.Chat Micro-Services

## Docker Compose

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
