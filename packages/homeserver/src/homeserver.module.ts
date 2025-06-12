import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { container } from 'tsyringe';
import type { RouteHandler } from './controllers/base.controller';
import { ClientVersionsController, FederationApiController, getAllRoutes, InternalInviteController, InternalMessageController, InternalPingController, InternalRoomController, KeyServerController, registerAllElysiaRoutes, WellKnownController } from './controllers';
import { createLogger } from './utils/logger';

// Import all services
import { EventService } from './services/event.service';
import { InviteService } from './services/invite.service';
import { MessageService } from './services/message.service';
import { RoomService } from './services/room.service';
import { ConfigService } from './services/config.service';
import { DatabaseConnectionService } from './services/database-connection.service';
import { EventAuthorizationService } from './services/event-authorization.service';
import { EventFetcherService } from './services/event-fetcher.service';
import { EventStateService } from './services/event-state.service';
import { MissingEventService } from './services/missing-event.service';
import { NotificationService } from './services/notification.service';
import { ProfilesService } from './services/profiles.service';
import { ServerService } from './services/server.service';
import { StagingAreaService } from './services/staging-area.service';
import { WellKnownService } from './services/well-known.service';

// Import all repositories
import { EventRepository } from './repositories/event.repository';
import { KeyRepository } from './repositories/key.repository';
import { RoomRepository } from './repositories/room.repository';
import { ServerRepository } from './repositories/server.repository';

// Import federation SDK services
import { FederationConfigService } from './federation-sdk/services/federation-config.service';
import { FederationRequestService } from './federation-sdk/services/federation-request.service';
import { FederationService } from './federation-sdk/services/federation.service';
import { SignatureVerificationService } from './federation-sdk/services/signature-verification.service';

export class HomeserverModule {
	private app?: Elysia;
	private routeHandlers?: RouteHandler[];

	constructor() {
		// Initialize services in the container
		this.registerServices();
	}

	private registerServices(): void {
		// Register all services
		container.register(EventService, { useClass: EventService });
		container.register(InviteService, { useClass: InviteService });
		container.register(MessageService, { useClass: MessageService });
		container.register(RoomService, { useClass: RoomService });
		container.register(ConfigService, { useClass: ConfigService });
		container.register(DatabaseConnectionService, { useClass: DatabaseConnectionService });
		container.register(EventAuthorizationService, { useClass: EventAuthorizationService });
		container.register(EventFetcherService, { useClass: EventFetcherService });
		container.register(EventStateService, { useClass: EventStateService });
		container.register(MissingEventService, { useClass: MissingEventService });
		container.register(NotificationService, { useClass: NotificationService });
		container.register(ProfilesService, { useClass: ProfilesService });
		container.register(ServerService, { useClass: ServerService });
		container.register(StagingAreaService, { useClass: StagingAreaService });
		container.register(WellKnownService, { useClass: WellKnownService });

		// Register federation SDK services
		container.register(FederationConfigService, { useClass: FederationConfigService });
		container.register(FederationRequestService, { useClass: FederationRequestService });
		container.register(FederationService, { useClass: FederationService });
		container.register(SignatureVerificationService, { useClass: SignatureVerificationService });

		// Register repositories
		container.register(EventRepository, { useClass: EventRepository });
		container.register(KeyRepository, { useClass: KeyRepository });
		container.register(RoomRepository, { useClass: RoomRepository });
		container.register(ServerRepository, { useClass: ServerRepository });

		// Register controllers
		container.register(FederationApiController, { useClass: FederationApiController });
		container.register(InternalInviteController, { useClass: InternalInviteController });
		container.register(InternalMessageController, { useClass: InternalMessageController });
		container.register(InternalPingController, { useClass: InternalPingController });
		container.register(InternalRoomController, { useClass: InternalRoomController });
		container.register(KeyServerController, { useClass: KeyServerController });
		container.register(WellKnownController, { useClass: WellKnownController });
		container.register(ClientVersionsController, { useClass: ClientVersionsController });
	}

	async createApp(): Promise<Elysia> {
		// Check if we're running in microservice mode
		const isMicroservice = process.env.HOMESERVER_MODE === 'microservice';

		if (!isMicroservice) {
			// In monolith mode, just export route handlers without creating Elysia app
			this.routeHandlers = getAllRoutes();
			return {} as Elysia; // Return dummy object
		}

		// Get configuration from environment or use defaults
		// const serverName = process.env.HOMESERVER_DOMAIN || 'localhost';

		// Create Elysia app for microservice mode
		this.app = new Elysia()
			.use(swagger())
			.use(cors())
			.onError(({ error, set }) => {
				// Log the error
				const logger = createLogger('ErrorHandler');
				logger.error('Request error:', error);
				
				// Set appropriate status code
				if (error instanceof Error) {
					if (error.message.includes('not found')) {
						set.status = 404;
					} else if (error.message.includes('unauthorized')) {
						set.status = 401;
					} else if (error.message.includes('forbidden')) {
						set.status = 403;
					} else {
						set.status = 500;
					}
				}
				
				return {
					errcode: 'M_UNKNOWN',
					error: error instanceof Error ? error.message : 'Internal server error',
				};
			});

		// Register all routes from controllers
		registerAllElysiaRoutes(this.app);

		return this.app;
	}

	getRouteHandlers(): RouteHandler[] {
		if (!this.routeHandlers) {
			this.routeHandlers = getAllRoutes();
		}
		return this.routeHandlers;
	}

	async start(port?: number): Promise<void> {
		if (!this.app) {
			throw new Error('App not initialized. Call createApp() first.');
		}

		const listenPort = port || parseInt(process.env.HOMESERVER_PORT || '8080', 10);
		await this.app.listen(listenPort);
		console.log(`Homeserver listening on port ${listenPort}`);
	}
}

export const homeserverModule = new HomeserverModule();

export const appPromise = homeserverModule.createApp();

export const getHomeserverRouteHandlers = () => homeserverModule.getRouteHandlers();