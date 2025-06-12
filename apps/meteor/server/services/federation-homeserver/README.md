# Homeserver Federation Service

This service provides federation capabilities for connecting Rocket.Chat with custom homeserver implementations.

## Architecture Overview

The service follows a layered architecture:

1. **Domain Layer** - Core business entities and interfaces
   - `FederatedHomeserverUser`
   - `FederatedHomeserverRoom`
   - `FederatedHomeserverMessage`

2. **Application Layer** - Business logic and use cases
   - Message, Room, and User service receivers/senders
   - Event handlers for processing incoming/outgoing federation events

3. **Infrastructure Layer** - External integrations
   - Rocket.Chat adapters (Room, User, Message, Notification)
   - Homeserver bridge implementation
   - API routes for receiving federation events
   - Hooks for intercepting Rocket.Chat events

## Key Components

### Service Class (`service.ts`)
- Main service implementation extending `ServiceClass`
- Manages bridge lifecycle (start/stop)
- Handles configuration changes
- Registers/unregisters hooks

### API Routes (`/app/api/server/v1/homeserver-federation.ts`)
- Health check endpoint: `GET /api/v1/homeserver/federation/health`
- Transaction endpoint: `POST /api/v1/homeserver/federation/v1/send/:txnId`
- Validates homeserver tokens for authentication

### Hooks (`infrastructure/rocket-chat/hooks/`)
- Intercepts Rocket.Chat events for outgoing federation
- Prevents federation loops by checking message metadata
- Handles:
  - Message send/delete
  - Room creation
  - User join/leave
  - Profile updates

### Adapters
- Use existing Rocket.Chat collections (Rooms, Users)
- Store federation metadata within existing documents
- Single new collection for ID mappings: `HomeserverFederationMapping`

## Configuration

Settings available in Admin > Federation > Homeserver Federation:
- `Federation_Homeserver_enabled` - Enable/disable the service
- `Federation_Homeserver_url` - Homeserver base URL
- `Federation_Homeserver_domain` - Federation domain
- `Federation_Homeserver_bridge_port` - Port for bridge service
- `Federation_Homeserver_app_service_token` - Authentication token for app service
- `Federation_Homeserver_homeserver_token` - Authentication token from homeserver

## Integration Points

1. **Startup** - Service is registered in `/ee/server/startup/services.ts`
2. **Settings** - Configuration in `/server/settings/federation-homeserver.ts`
3. **Core Services** - Types defined in `@rocket.chat/core-services`

## Development Notes

- The homeserver package is currently a dummy implementation
- Replace with actual homeserver SDK when available
- Federation flags prevent message loops
- All federated content is marked with `federation.type = 'homeserver'`