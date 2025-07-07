import 'reflect-metadata';

import { toUnpaddedBase64 } from '@hs/core';
import {
	ConfigService,
	EventRepository,
	type FederationModuleOptions,
	FederationRequestService,
	FederationService,
	type HomeserverEventSignatures,
	KeyRepository,
	RoomRepository,
	ServerRepository,
	StateEventRepository,
	StateRepository,
	MissingEventListener,
	DatabaseConnectionService,
	EventAuthorizationService,
	EventFetcherService,
	EventStateService,
	EventService,
	EventEmitterService,
	InviteService,
	MessageService,
	MissingEventService,
	NotificationService,
	ProfilesService,
	RoomService,
	ServerService,
	StateService,
	StagingAreaService,
	WellKnownService,
	LockManagerService,
	MissingEventsQueue,
	StagingAreaListener,
	StagingAreaQueue,
} from '@hs/federation-sdk';
import { Emitter } from '@rocket.chat/emitter';
import { container } from 'tsyringe';

export async function setup(emitter: Emitter<HomeserverEventSignatures> = new Emitter<HomeserverEventSignatures>()) {
	const config = new ConfigService();
	const matrixConfig = config.getMatrixConfig();
	const serverConfig = config.getServerConfig();
	const signingKeys = await config.getSigningKey();
	const signingKey = signingKeys[0];

	container.register<FederationModuleOptions>('FEDERATION_OPTIONS', {
		useValue: {
			serverName: matrixConfig.serverName,
			signingKey: toUnpaddedBase64(signingKey.privateKey),
			signingKeyId: `ed25519:${signingKey.version}`,
			timeout: 30000,
			baseUrl: serverConfig.baseUrl,
		},
	});

	container.registerSingleton(FederationRequestService);
	container.registerSingleton('ConfigService', ConfigService);
	container.registerSingleton('DatabaseConnectionService', DatabaseConnectionService);
	container.registerSingleton('StateRepository', StateRepository);
	container.registerSingleton(StateService);
	container.registerSingleton(EventAuthorizationService);
	container.registerSingleton(EventFetcherService);
	container.registerSingleton(EventStateService);
	container.registerSingleton('EventService', EventService);
	container.registerSingleton(EventEmitterService);
	container.registerSingleton(InviteService);
	container.registerSingleton(MessageService);
	container.registerSingleton(MissingEventService);
	container.registerSingleton(NotificationService);
	container.registerSingleton(ProfilesService);
	container.registerSingleton(RoomService);
	container.registerSingleton('RoomService', RoomService);
	container.registerSingleton(ServerService);
	container.registerSingleton(StagingAreaService);
	container.registerSingleton('StagingAreaService', StagingAreaService);
	container.registerSingleton(WellKnownService);
	container.registerSingleton('EventRepository', EventRepository);
	container.registerSingleton('KeyRepository', KeyRepository);
	container.registerSingleton('RoomRepository', RoomRepository);
	container.registerSingleton('ServerRepository', ServerRepository);
	container.registerSingleton('StateRepository', StateRepository);
	container.registerSingleton('StateEventRepository', StateEventRepository);
	container.registerSingleton('MissingEventsQueue', MissingEventsQueue);
	container.registerSingleton('StagingAreaQueue', StagingAreaQueue);
	container.registerSingleton(MissingEventListener);
	container.registerSingleton(StagingAreaListener);
	container.registerSingleton('FederationService', FederationService);

	container.register(LockManagerService, {
		useFactory: () => new LockManagerService({ type: 'memory' }),

		// NATS configuration example:
		// useFactory: () => new LockManagerService({
		// 	type: 'nats',
		// 	servers: ['nats://localhost:4222'],
		// 	timeout: 5000,
		// 	reconnect: true,
		// 	maxReconnectAttempts: 10
		// })
	});

	const eventEmitterService = container.resolve(EventEmitterService);

	eventEmitterService.setEmitter(emitter);

	container.resolve(StagingAreaListener);
	container.resolve(MissingEventListener);
}
