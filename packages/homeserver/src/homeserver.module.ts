import 'reflect-metadata';

import { container } from 'tsyringe';
import type { RouteHandler } from './controllers/base.controller';
import { getAllRoutes } from './controllers';

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
import { EventRepository } from './repositories/event.repository';
import { KeyRepository } from './repositories/key.repository';
import { RoomRepository } from './repositories/room.repository';
import { ServerRepository } from './repositories/server.repository';
import { StagingAreaQueue } from './queues/staging-area.queue';
import { MissingEventsQueue } from './queues/missing-event.queue';
import { FederationConfigService } from './federation-sdk/services/federation-config.service';
import { FederationRequestService } from './federation-sdk/services/federation-request.service';
import { FederationService } from './federation-sdk/services/federation.service';
import { SignatureVerificationService } from './federation-sdk/services/signature-verification.service';
import { MissingEventListener } from './listeners/missing-event.listener';
import { StagingAreaListener } from './listeners/staging-area.listener';

export class HomeserverModule {
	private routeHandlers?: RouteHandler[];
	private servicesInitialized = false;

	constructor() {}

	private registerServices(): void {
		container.registerSingleton('ConfigService', ConfigService);
		
		const configService = container.resolve<ConfigService>('ConfigService');
		const serverConfig = configService.getServerConfig();
		const matrixConfig = configService.getMatrixConfig();
		
		container.register('FEDERATION_OPTIONS', { 
			useValue: {
				serverName: matrixConfig.serverName,
				signingKey: process.env.HOMESERVER_SIGNING_KEY || '',
				signingKeyId: 'ed25519:1',
				timeout: 30000,
				baseUrl: serverConfig.baseUrl
			}
		});
		
		container.registerSingleton('EventService', EventService);
		container.registerSingleton('InviteService', InviteService);
		container.registerSingleton('MessageService', MessageService);
		container.registerSingleton('RoomService', RoomService);
		container.registerSingleton('DatabaseConnectionService', DatabaseConnectionService);
		container.registerSingleton('EventAuthorizationService', EventAuthorizationService);
		container.registerSingleton('EventFetcherService', EventFetcherService);
		container.registerSingleton('EventStateService', EventStateService);
		container.registerSingleton('MissingEventService', MissingEventService);
		container.registerSingleton('NotificationService', NotificationService);
		container.registerSingleton('ProfilesService', ProfilesService);
		container.registerSingleton('ServerService', ServerService);
		container.registerSingleton('StagingAreaService', StagingAreaService);
		container.registerSingleton('WellKnownService', WellKnownService);

		container.registerSingleton('FederationConfigService', FederationConfigService);
		container.registerSingleton('FederationRequestService', FederationRequestService);
		container.registerSingleton('FederationService', FederationService);
		container.registerSingleton('SignatureVerificationService', SignatureVerificationService);

		container.registerSingleton('EventRepository', EventRepository);
		container.registerSingleton('KeyRepository', KeyRepository);
		container.registerSingleton('RoomRepository', RoomRepository);
		container.registerSingleton('ServerRepository', ServerRepository);
		
		container.registerSingleton('StagingAreaQueue', StagingAreaQueue);
		container.registerSingleton('MissingEventsQueue', MissingEventsQueue);
	}
	
	private initializeListeners(): void {
		container.resolve(MissingEventListener);
		container.resolve(StagingAreaListener);
	}

	async initialize(): Promise<void> {
		if (!this.servicesInitialized) {
			this.registerServices();
			this.initializeListeners();
			this.servicesInitialized = true;
		}
		
		this.routeHandlers = await getAllRoutes();
	}

	async getRouteHandlers(): Promise<RouteHandler[]> {
		if (!this.servicesInitialized) {
			await this.initialize();
		}
		
		if (!this.routeHandlers) {
			this.routeHandlers = await getAllRoutes();
		}
		return this.routeHandlers;
	}

	getContainer() {
		return container;
	}
}

export const homeserverModule = new HomeserverModule();

export const getHomeserverRouteHandlers = async () => await homeserverModule.getRouteHandlers();