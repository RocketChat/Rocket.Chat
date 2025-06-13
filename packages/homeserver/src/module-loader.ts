import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';
import { ConfigService } from './services/config.service';
import type { RouteDefinition, HomeserverInternalConfig } from './types';

export class HomeserverModuleLoader {
	private container: DependencyContainer;
	private initialized = false;

	constructor() {
		// Create a child container to isolate homeserver dependencies
		this.container = container.createChildContainer();
	}

	/**
	 * Initialize the homeserver module with configuration
	 */
	async initialize(config: HomeserverInternalConfig): Promise<void> {
		if (this.initialized) {
			return;
		}

		// Register configuration
		this.container.register('HomeserverConfig', { useValue: config });
		
		// Create and register ConfigService with environment overrides
		const configService = new ConfigService();
		this.container.registerInstance(ConfigService, configService);

		// Register all services, repositories, and controllers
		await this.registerDependencies();

		this.initialized = true;
	}

	/**
	 * Register all dependencies in the correct order
	 */
	private async registerDependencies(): Promise<void> {
		// Register repositories first
		await this.registerRepositories();
		
		// Register queues
		await this.registerQueues();
		
		// Then register services
		await this.registerServices();
		
		// Finally register controllers
		await this.registerControllers();
	}

	private async registerRepositories(): Promise<void> {
		console.log('[HomeserverModuleLoader] Registering repositories...');
		
		// Import all repositories
		const { EventRepository } = await import('./repositories/event.repository');
		const { RoomRepository } = await import('./repositories/room.repository');
		const { KeyRepository } = await import('./repositories/key.repository');
		const { ServerRepository } = await import('./repositories/server.repository');
		
		// Register repositories
		this.container.registerSingleton('EventRepository', EventRepository);
		this.container.registerSingleton('RoomRepository', RoomRepository);
		this.container.registerSingleton('KeyRepository', KeyRepository);
		this.container.registerSingleton('ServerRepository', ServerRepository);
		
		// Also register by class name
		this.container.registerSingleton(EventRepository);
		this.container.registerSingleton(RoomRepository);
		this.container.registerSingleton(KeyRepository);
		this.container.registerSingleton(ServerRepository);
	}

	private async registerQueues(): Promise<void> {
		console.log('[HomeserverModuleLoader] Registering queues...');
		
		// Import queues
		const { StagingAreaQueue } = await import('./queues/staging-area.queue');
		const { MissingEventsQueue } = await import('./queues/missing-event.queue');
		
		// Register queues as singletons
		this.container.registerSingleton('StagingAreaQueue', StagingAreaQueue);
		this.container.registerSingleton('MissingEventQueue', MissingEventsQueue);
		
		// Also register by class name
		this.container.registerSingleton(StagingAreaQueue);
		this.container.registerSingleton(MissingEventsQueue);
	}

	private async registerServices(): Promise<void> {
		console.log('[HomeserverModuleLoader] Registering services...');
		
		// Import all services
		const { EventService } = await import('./services/event.service');
		const { ConfigService } = await import('./services/config.service');
		const { RoomService } = await import('./services/room.service');
		const { MessageService } = await import('./services/message.service');
		const { InviteService } = await import('./services/invite.service');
		const { ProfilesService } = await import('./services/profiles.service');
		const { WellKnownService } = await import('./services/well-known.service');
		const { ServerService } = await import('./services/server.service');
		const { NotificationService } = await import('./services/notification.service');
		
		// Register services by token name (for compatibility)
		this.container.registerSingleton('EventService', EventService);
		this.container.registerSingleton('ConfigService', ConfigService);
		this.container.registerSingleton('RoomService', RoomService);
		this.container.registerSingleton('MessageService', MessageService);
		this.container.registerSingleton('InviteService', InviteService);
		this.container.registerSingleton('ProfilesService', ProfilesService);
		this.container.registerSingleton('WellKnownService', WellKnownService);
		this.container.registerSingleton('ServerService', ServerService);
		this.container.registerSingleton('NotificationService', NotificationService);
		
		// Also register by class name for direct resolution
		this.container.registerSingleton(EventService);
		this.container.registerSingleton(ConfigService);
		this.container.registerSingleton(RoomService);
		this.container.registerSingleton(MessageService);
		this.container.registerSingleton(InviteService);
		this.container.registerSingleton(ProfilesService);
		this.container.registerSingleton(WellKnownService);
		this.container.registerSingleton(ServerService);
		this.container.registerSingleton(NotificationService);
	}

	private async registerControllers(): Promise<void> {
		// These will be imported and registered as we copy them over
		console.log('[HomeserverModuleLoader] Registering controllers...');
	}

	/**
	 * Get all routes from the homeserver module
	 */
	getRoutes(): RouteDefinition[] {
		if (!this.initialized) {
			throw new Error('Module not initialized. Call initialize() first.');
		}

		// This will collect routes from all controllers
		const routes: RouteDefinition[] = [];

		// For now, return empty array
		// We'll populate this as we add controllers
		return routes;
	}

	/**
	 * Get a specific service instance
	 */
	getService<T>(token: string): T {
		if (!this.initialized) {
			throw new Error('Module not initialized. Call initialize() first.');
		}

		return this.container.resolve<T>(token);
	}

	/**
	 * Get the DI container for advanced usage
	 */
	getContainer(): DependencyContainer {
		return this.container;
	}

	/**
	 * Shutdown and clean up
	 */
	async shutdown(): Promise<void> {
		this.container.clearInstances();
		this.initialized = false;
	}
}