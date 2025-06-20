# Federation Service

Multi-mode service for running federation-related functionality. Supports both microservice (isolated) and local-broker (embedded) modes.

## Execution Modes

### 1. Microservice Mode (MS)
- Runs as an independent service with its own Hono server
- Used in container/distributed deployments
- Starts on dedicated port (default: 3030)

### 2. Local Broker Mode
- Integrates with Rocket.Chat's existing Hono server
- Used in monolithic deployments
- Routes are imported by main application

## Quick Start

### Development
```bash
# Install dependencies
bun install

# Run in development mode
bun run dev
```

### Docker
```bash
# Build image
docker build -t rocketchat/federation-service .

# Run container
docker run -p 3030:3030 rocketchat/federation-service
```

### Docker Compose
```bash
docker-compose up
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| MS_MODE | false | Enable microservice mode |
| FEDERATION_MODE | - | Set to 'isolated' for MS mode |
| DEPLOY_MODE | - | Set to 'microservice' for MS mode |
| FEDERATION_SERVICE_PORT | 3030 | Service port (MS mode only) |
| FEDERATION_SERVICE_HOST | 0.0.0.0 | Bind address (MS mode only) |
| FEDERATION_ROUTE_PREFIX | /federation | Route prefix |
| LOG_LEVEL | info | Log level |
| NODE_ENV | development | Environment |

## Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe
- `{prefix}/*` - All homeserver routes

## Development

The service automatically imports routes from the homeserver package via symlink at `ee/packages/homeserver`.