import type { DependencyContainer } from 'tsyringe';
import { container } from 'tsyringe';

// Import our adapters
import { RocketChatDatabaseAdapter } from './adapters/RocketChatDatabaseAdapter';
import { RocketChatEventBridge } from './adapters/RocketChatEventBridge';
import { RocketChatSettingsAdapter } from './adapters/RocketChatSettingsAdapter';

/**
 * Creates a separate DI container for homeserver integration
 * This keeps tsyringe isolated to just the homeserver code
 */
export function createHomeserverContainer(): DependencyContainer {
	// Create a child container to isolate homeserver dependencies
	const homeserverContainer = container.createChildContainer();

	// Register Rocket.Chat adapters
	homeserverContainer.register('DatabaseAdapter', { useClass: RocketChatDatabaseAdapter });
	homeserverContainer.register('SettingsAdapter', { useClass: RocketChatSettingsAdapter });
	homeserverContainer.register('EventBridge', { useClass: RocketChatEventBridge });

	// Register homeserver repositories
	homeserverContainer.register('EventRepository', { useClass: EventRepository });
	homeserverContainer.register('RoomRepository', { useClass: RoomRepository });
	homeserverContainer.register('ServerRepository', { useClass: ServerRepository });
	homeserverContainer.register('KeyRepository', { useClass: KeyRepository });

	// Register homeserver services
	homeserverContainer.register('EventService', { useClass: EventService });
	homeserverContainer.register('RoomService', { useClass: RoomService });
	homeserverContainer.register('MessageService', { useClass: MessageService });
	homeserverContainer.register('InviteService', { useClass: InviteService });
	homeserverContainer.register('ProfilesService', { useClass: ProfilesService });
	homeserverContainer.register('WellKnownService', { useClass: WellKnownService });

	return homeserverContainer;
}

/**
 * Get route handlers from the homeserver module
 * These are transport-agnostic and can be used with Rocket.Chat's API
 */
export function getHomeserverRoutes() {
	return getHomeserverRouteHandlers();
}