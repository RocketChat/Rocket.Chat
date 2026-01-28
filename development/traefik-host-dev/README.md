# Traefik Load Balancer for Rocket.Chat Development

This setup provides a Traefik Docker container that can load balance multiple Rocket.Chat instances running directly on the host machine (e.g., with `yarn dev`). This is particularly useful for testing high availability scenarios and load balancing behavior during development.

## Overview

This configuration uses Traefik's [host networking mode](https://doc.traefik.io/traefik/providers/docker/#network) to access services running on the host machine, eliminating the need to run Rocket.Chat instances inside Docker containers during development.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐
│   Browser       │    │   Traefik        │
│   localhost:3000├────┤   (Docker)       │
└─────────────────┘    │   Host Network   │
                       └─────────┬────────┘
                                 │ Load Balances
                       ┌─────────┼────────┐
                       │         │        │
                ┌──────▼──┐ ┌────▼───┐ ┌──▼─────┐
                │ RC:3000 │ │ RC:3002│ │ RC:3003│
                │ (Host)  │ │ (Host) │ │ (Host) │
                └─────────┘ └────────┘ └────────┘
```

## Prerequisites

- Docker and Docker Compose installed
- Node.js and Yarn installed for running Rocket.Chat
- MongoDB running (for Rocket.Chat instances)

## Configuration Files

### 1. `docker-compose.yml`
Defines the Traefik container with host networking:
- Uses `network_mode: "host"` to access host services
- Mounts static and dynamic configuration files
- Based on [Traefik Docker documentation](https://doc.traefik.io/traefik/getting-started/install-traefik/#use-the-official-docker-image)

### 2. `traefik.yml` (Static Configuration)
Main Traefik configuration:
- **Entry Points**: Defines ports (3000 for HTTP, 8080 for dashboard)
- **Providers**: Configures file provider for dynamic configuration
- **API**: Enables dashboard for monitoring
- Reference: [Static Configuration](https://doc.traefik.io/traefik/reference/static-configuration/file/)

### 3. `config/rocketchat.yml` (Dynamic Configuration)
Load balancing rules for Rocket.Chat:
- **Routers**: Define routing rules and priorities
- **Services**: Configure backend servers and health checks
- **Load Balancing**: Uses sticky sessions for WebSocket compatibility
- Reference: [Dynamic Configuration](https://doc.traefik.io/traefik/reference/dynamic-configuration/file/)

## Setup Instructions

### Step 1: Start Traefik

```bash
cd development/traefik-host-dev
docker-compose up -d
```

### Step 2: Configure Your Hosts File (Optional)

Add these entries to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 rocketchat.localhost
127.0.0.1 traefik.localhost
127.0.0.1 prometheus.localhost
127.0.0.1 grafana.localhost
```

### Step 3: Start Multiple Rocket.Chat Instances

#### Instance 1 (Default)
```bash
# In your Rocket.Chat project root
yarn dev
# This will start on port 3000 by default
```

#### Instance 2
```bash
# In a separate terminal/directory
PORT=3002 yarn dev
# Or use environment variables:
# ROOT_URL=http://localhost:3002 PORT=3002 yarn dev
```

#### Instance 3
```bash
# In another terminal/directory
PORT=3003 yarn dev
```

### Step 4: Update Dynamic Configuration

Edit `config/rocketchat.yml` and uncomment additional server entries:

```yaml
servers:
  - url: "http://127.0.0.1:3000"
    weight: 1
  - url: "http://127.0.0.1:3002"  # Uncomment this
    weight: 1
  - url: "http://127.0.0.1:3003"  # Uncomment this
    weight: 1
```

Traefik will automatically reload the configuration due to the `watch: true` setting.

## Access Points

- **Rocket.Chat Application**: http://localhost:3000 or http://rocketchat.localhost:3000
- **Traefik Dashboard**: http://localhost:8080 or http://traefik.localhost:8080
- **WebSocket Connections**: Automatically routed through the same entry point

## Load Balancing Features

### Sticky Sessions
The configuration uses [sticky sessions](https://doc.traefik.io/traefik/routing/services/#sticky-sessions) to ensure WebSocket connections remain with the same backend server:

```yaml
sticky:
  cookie:
    name: "rocketchat-server"
    secure: false
    httpOnly: true
```

### Health Checks
Automatic health checking ensures traffic only goes to healthy instances:

```yaml
healthCheck:
  path: "/api/info"
  interval: "30s"
  timeout: "5s"
  scheme: "http"
```

### WebSocket Support
Special routing rules handle WebSocket connections:
- Higher priority routes for `/websocket` and `/sockjs` paths
- Maintains connection affinity through sticky sessions

## Monitoring and Debugging

### Traefik Dashboard
Access the dashboard at http://localhost:8080 to:
- View active routes and services
- Monitor backend server health
- Debug routing issues
- View real-time metrics

### Logs
View Traefik logs:
```bash
docker-compose logs -f traefik
```

### Testing Load Balancing
1. Start multiple Rocket.Chat instances
2. Open browser developer tools
3. Check the `rocketchat-server` cookie to see which instance you're connected to
4. Refresh multiple times to see load balancing in action

## Troubleshooting

### Common Issues

1. **"Service Unavailable" Error**
   - Ensure Rocket.Chat instances are running on the configured ports
   - Check health check endpoint: `curl http://localhost:3000/api/info`

2. **WebSocket Connection Issues**
   - Verify sticky sessions are enabled
   - Check that WebSocket routes have higher priority

3. **Configuration Not Reloading**
   - Ensure `watch: true` is set in `traefik.yml`
   - Check file permissions on config directory

### Debug Mode
Enable debug logging in `traefik.yml`:
```yaml
log:
  level: DEBUG
```

## Why This Setup Works

### Host Networking
Using `network_mode: "host"` allows the Traefik container to:
- Access services on `localhost` and `127.0.0.1` directly
- Avoid Docker networking complexity
- Maintain performance equivalent to native networking
- Reference: [Docker Host Networking](https://docs.docker.com/network/host/)

### File Provider
The [file provider](https://doc.traefik.io/traefik/providers/file/) enables:
- Dynamic configuration without container restarts
- Version control of routing rules
- Easy modification during development
- Automatic reloading with `watch: true`

### Load Balancing Strategy
The configuration uses Traefik's [load balancing capabilities](https://doc.traefik.io/traefik/routing/services/#load-balancing):
- Round-robin distribution by default
- Sticky sessions for WebSocket compatibility
- Health checks for automatic failover
- Weighted distribution support

## Advanced Configuration

### Custom Load Balancing Algorithm
Change the load balancing method in `config/rocketchat.yml`:

```yaml
# For least connections
loadBalancer:
  strategy: leastconn

# For IP hash-based routing
loadBalancer:
  strategy: iphash
```

### Rate Limiting
Enable rate limiting middleware:
```yaml
middlewares:
  rate-limit:
    rateLimit:
      burst: 100
      average: 50
```

### SSL/TLS (Production-like Testing)
For HTTPS testing, modify entry points and add certificates:
```yaml
entryPoints:
  websecure:
    address: ":443"
    http:
      tls:
        options: default
```

## References

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Docker Host Networking](https://docs.docker.com/network/host/)
- [Traefik File Provider](https://doc.traefik.io/traefik/providers/file/)
- [Load Balancing with Traefik](https://doc.traefik.io/traefik/routing/services/#load-balancing)
- [Sticky Sessions](https://doc.traefik.io/traefik/routing/services/#sticky-sessions)
- [Health Checks](https://doc.traefik.io/traefik/routing/services/#health-check)