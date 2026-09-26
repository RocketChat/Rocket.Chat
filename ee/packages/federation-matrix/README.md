# Federation Matrix

Rocket.Chat's Matrix federation integration package for cross-platform communication.

## Integration Tests

### Setup

Before running integration tests, add the following entries to your `/etc/hosts` file:

```
127.0.0.1       element
127.0.0.1       hs1
127.0.0.1       rc1
```

### How It Works

The integration test script builds Rocket.Chat locally, starts the federation services (Rocket.Chat, Synapse, MongoDB, and the XMPP appservice test bridge), waits for all services to be ready, then runs end-to-end tests. The script automatically handles cleanup unless you specify otherwise.

### Available Flags

- **No flags (default)**: Builds local code and runs tests
- `--image [IMAGE]`: Uses a pre-built Docker image instead of building locally (defaults to `rocketchat/rocket.chat:latest` if no image specified)
- `--keep-running`: Keeps containers running after tests complete for manual validation
- `--element`: Includes Element web client in the test environment
- `--no-test`: Starts containers and skips running tests (useful for manual testing or debugging)

### Usage Examples

**Basic local testing:**
```bash
yarn test:integration
```

**Test with pre-built image:**
```bash
yarn test:integration --image
```

**Test with specific pre-built image:**
```bash
yarn test:integration --image rocketchat/rocket.chat:latest
```

**Keep services running for manual inspection:**
```bash
yarn test:integration --keep-running
```

**Run with Element client:**
```bash
yarn test:integration --element
```

**Start containers only (skip tests):**
```bash
yarn test:integration --no-test
```

**Start containers with Element and keep them running (skip tests):**
```bash
yarn test:integration --keep-running --element --no-test
```

**Combine flags:**
```bash
yarn test:integration --image rocketchat/rocket.chat:latest --keep-running --element
```

### Service URLs (when using --keep-running or --no-test)

- **Rocket.Chat**: https://rc1
- **Synapse**: https://hs1  
- **XMPP appservice test bridge**: http://localhost:3300
- **MongoDB**: localhost:27017
- **Element**: https://element (when using --element flag)

### XMPP Appservice Test Bridge

The integration environment includes a Matrix appservice test bridge for XMPP contract tests. It is intentionally not a real XMPP server. It implements the appservice endpoints Rocket.Chat needs for XMPP room and user queries, transaction delivery, and ping checks.

The bridge is started by the `test` and `element` Docker Compose profiles and is used by the XMPP federation Jest spec.

Useful test-control endpoints:

- `GET /__health`: bridge health and config
- `POST /__reset`: reset in-memory rooms, transactions, cached user mappings, and failures
- `GET /__rooms`: list test rooms created by alias queries
- `GET /__transactions`: inspect Matrix appservice transactions delivered by Rocket.Chat
- `POST /__rooms/:alias/messages`: inject a test XMPP participant message into a bridged room
- `POST /__rooms/:alias/failure`: make a room alias query fail for rejection-path tests
