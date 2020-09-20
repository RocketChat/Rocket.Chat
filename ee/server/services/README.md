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