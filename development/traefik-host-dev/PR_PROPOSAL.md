# PR Proposal: Traefik Load Balancer for Host-based Development

## Summary

This PR adds comprehensive documentation and configuration files for running a Traefik Docker container that can load balance multiple Rocket.Chat instances running directly on the host machine (e.g., with `yarn dev`). This setup is essential for testing high availability scenarios and load balancing behavior during development without the complexity of containerizing the development instances.

## Problem Statement

The existing Traefik configurations in the repository (`docker-compose-local.yml`, `docker-compose-ci.yml`, and the microservices setup) only work when Rocket.Chat instances are running inside Docker containers. This creates friction for developers who want to:

1. Test load balancing with multiple development instances
2. Debug high availability scenarios
3. Develop with hot-reloading while testing load balancing
4. Simulate production load balancing behavior in development

## Solution

This PR introduces a new Traefik setup that uses Docker's host networking mode to access services running directly on the host machine. The solution includes:

### Files Added

```
development/traefik-host-dev/
├── README.md                    # Comprehensive setup documentation
├── docker-compose.yml           # Traefik container with host networking
├── traefik.yml                  # Static configuration
├── config/
│   ├── rocketchat.yml          # Dynamic routing and load balancing rules
│   └── monitoring.yml          # Optional monitoring services configuration
├── .env.example                # Environment variables template
├── start-instances.sh          # Helper script to start multiple instances
└── PR_PROPOSAL.md              # This proposal document
```

### Key Features

1. **Host Network Access**: Uses `network_mode: "host"` to access localhost services
2. **Dynamic Configuration**: File-based configuration with automatic reloading
3. **WebSocket Support**: Proper routing for real-time connections with sticky sessions
4. **Health Checks**: Automatic health monitoring of backend instances
5. **Development Tools**: Helper scripts and comprehensive documentation
6. **Monitoring Integration**: Optional Prometheus/Grafana integration

## Technical Implementation

### Docker Compose Configuration

```yaml
services:
  traefik:
    image: traefik:v3.1
    container_name: traefik_dev_load_balancer
    network_mode: "host"  # Key feature for accessing host services
    volumes:
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./config:/etc/traefik/config:ro
    restart: unless-stopped
```

### Why Host Networking Works

According to [Traefik's Docker documentation](https://doc.traefik.io/traefik/providers/docker/#network), host networking allows the container to:
- Access services on `localhost` and `127.0.0.1` directly
- Avoid Docker networking complexity
- Maintain performance equivalent to native networking
- Eliminate port mapping issues

### Load Balancing Configuration

The dynamic configuration implements:

1. **Sticky Sessions**: Essential for WebSocket compatibility
   ```yaml
   sticky:
     cookie:
       name: "rocketchat-server"
       secure: false
       httpOnly: true
   ```

2. **Health Checks**: Automatic failover using Rocket.Chat's `/api/info` endpoint
   ```yaml
   healthCheck:
     path: "/api/info"
     interval: "30s"
     timeout: "5s"
   ```

3. **Priority Routing**: WebSocket paths get higher priority
   ```yaml
   rocketchat-websocket:
     rule: "(Host(`localhost`)) && (PathPrefix(`/websocket`) || PathPrefix(`/sockjs`))"
     priority: 2  # Higher than main HTTP router
   ```

## Usage Example

```bash
# 1. Start Traefik
cd development/traefik-host-dev
docker-compose up -d

# 2. Start multiple Rocket.Chat instances
yarn dev                    # Instance 1 on port 3000
PORT=3002 yarn dev         # Instance 2 on port 3002
PORT=3003 yarn dev         # Instance 3 on port 3003

# 3. Access load-balanced application
curl http://localhost:3000  # Traffic distributed across instances
```

## Benefits

1. **Development Efficiency**: Developers can test HA scenarios without complex Docker setups
2. **Hot Reloading**: Maintains development workflow with automatic code reloading
3. **Production Parity**: Simulates production load balancing behavior
4. **Debugging**: Easy access to individual instances and Traefik dashboard
5. **Documentation**: Comprehensive guides with Traefik documentation references

## Documentation Quality

The README.md includes:
- Step-by-step setup instructions
- Architecture diagrams
- Troubleshooting guides
- References to official Traefik documentation
- Advanced configuration examples
- Monitoring and debugging tips

## Testing

The configuration has been designed based on:
- [Traefik's official documentation](https://doc.traefik.io/traefik/)
- [Docker host networking best practices](https://docs.docker.com/network/host/)
- [Load balancing patterns](https://doc.traefik.io/traefik/routing/services/#load-balancing)
- WebSocket compatibility requirements for Rocket.Chat

## Impact

- **No breaking changes**: All new files in a separate directory
- **Optional feature**: Developers can choose to use this setup
- **Educational value**: Demonstrates Traefik concepts for the team
- **Production insights**: Helps developers understand load balancing behavior

## Future Enhancements

This setup provides a foundation for:
1. SSL/TLS testing with local certificates
2. Advanced middleware testing (rate limiting, auth)
3. Integration with monitoring tools
4. Performance testing scenarios

## References

- [Traefik File Provider Documentation](https://doc.traefik.io/traefik/providers/file/)
- [Docker Host Networking](https://docs.docker.com/network/host/)
- [Traefik Load Balancing](https://doc.traefik.io/traefik/routing/services/#load-balancing)
- [Sticky Sessions](https://doc.traefik.io/traefik/routing/services/#sticky-sessions)

This PR addresses a real development need while providing educational value and maintaining the high documentation standards of the Rocket.Chat project.