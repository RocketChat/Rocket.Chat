import { IncomingMessage } from 'node:http';
import { URL } from 'node:url';

import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IFederationService, FederationConfigurationStatus } from '@rocket.chat/core-services';
import { isRoomFederated, type IRoom } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import type { FederationRoomServiceSender } from './application/room/sender/RoomServiceSender';
import type { FederationUserServiceSender } from './application/user/sender/UserServiceSender';
import type { IFederationBridge } from './domain/IFederationBridge';
import { FederationFactory } from './infrastructure/Factory';
import type { InMemoryQueue } from './infrastructure/queue/InMemoryQueue';
import type { RocketChatFileAdapter } from './infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from './infrastructure/rocket-chat/adapters/Message';
import type { RocketChatNotificationAdapter } from './infrastructure/rocket-chat/adapters/Notification';
import type { RocketChatRoomAdapter } from './infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from './infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from './infrastructure/rocket-chat/adapters/User';
import { federationServiceLogger } from './infrastructure/rocket-chat/adapters/logger';
import { FederationRoomSenderConverter } from './infrastructure/rocket-chat/converters/RoomSender';
import { FederationHooks } from './infrastructure/rocket-chat/hooks';
import './infrastructure/rocket-chat/well-known';
import { throwIfFederationNotEnabledOrNotReady } from './utils';

function extractError(e: unknown) {
	if (e instanceof Error || (typeof e === 'object' && e && 'toString' in e)) {
		if ('name' in e && e.name === 'AbortError') {
			return 'Operation timed out';
		}

		return e.toString();
	}

	federationServiceLogger.error(e);

	return 'Unknown error';
}

// for airgapped deployments, use environment variable to override a local instance of federationtester
const federationTesterHost = process.env.FEDERATION_TESTER_HOST?.trim()?.replace(/\/$/, '') || 'https://federationtester.matrix.org';

export abstract class AbstractFederationService extends ServiceClassInternal {
	private cancelSettingsObserver: () => void;

	private internalQueueInstance: InMemoryQueue;

	private internalSettingsAdapter: RocketChatSettingsAdapter;

	private internalRoomServiceSender: FederationRoomServiceSender;

	private internalUserServiceSender: FederationUserServiceSender;

	private internalRoomAdapter: RocketChatRoomAdapter;

	private internalUserAdapter: RocketChatUserAdapter;

	private internalFileAdapter: RocketChatFileAdapter;

	private internalMessageAdapter: RocketChatMessageAdapter;

	private internalNotificationAdapter: RocketChatNotificationAdapter;

	private isRunning = false;

	protected PROCESSING_CONCURRENCY = 1;

	protected bridge: IFederationBridge;

	protected abstract setupInternalEphemeralListeners(): Promise<void>;

	protected abstract setupInternalValidators(): Promise<void>;

	protected abstract setupInternalActionListeners(): Promise<void>;

	protected abstract onEnableFederation(): Promise<void>;

	protected abstract onDisableFederation(): Promise<void>;

	constructor(
		federationBridge: IFederationBridge,
		internalQueueInstance: InMemoryQueue,
		internalSettingsAdapter: RocketChatSettingsAdapter,
	) {
		super();
		this.internalQueueInstance = internalQueueInstance;
		this.internalSettingsAdapter = internalSettingsAdapter;
		this.bridge = federationBridge;
		this.internalFileAdapter = FederationFactory.buildInternalFileAdapter();
		this.internalRoomAdapter = FederationFactory.buildInternalRoomAdapter();
		this.internalUserAdapter = FederationFactory.buildInternalUserAdapter();
		this.internalMessageAdapter = FederationFactory.buildInternalMessageAdapter();
		this.internalNotificationAdapter = FederationFactory.buildInternalNotificationAdapter();
		this.internalRoomServiceSender = FederationFactory.buildRoomServiceSender(
			this.internalRoomAdapter,
			this.internalUserAdapter,
			this.internalFileAdapter,
			this.internalMessageAdapter,
			this.internalSettingsAdapter,
			this.internalNotificationAdapter,
			this.bridge,
		);
		this.internalUserServiceSender = FederationFactory.buildUserServiceSender(
			this.internalRoomAdapter,
			this.internalUserAdapter,
			this.internalFileAdapter,
			this.internalSettingsAdapter,
			this.bridge,
		);
		this.setEventListeners();
	}

	private setEventListeners(): void {
		this.onEvent('user.avatarUpdate', async ({ username }): Promise<void> => {
			if (!this.isFederationEnabled()) {
				return;
			}
			if (!username) {
				return;
			}
			await this.internalUserServiceSender.afterUserAvatarChanged(username);
		});
		this.onEvent('user.typing', async ({ isTyping, roomId, user: { username } }): Promise<void> => {
			if (!roomId || !username) {
				return;
			}

			await this.internalUserServiceSender.onUserTyping(username, roomId, isTyping);
		});
		this.onEvent('user.realNameChanged', async ({ _id, name }): Promise<void> => {
			if (!this.isFederationEnabled()) {
				return;
			}
			if (!name || !_id) {
				return;
			}
			await this.internalUserServiceSender.afterUserRealNameChanged(_id, name);
		});
		this.onEvent(
			'federation.userRoleChanged',
			async (data: Record<string, any>): Promise<void> => FederationHooks.afterRoomRoleChanged(this.internalRoomServiceSender, data),
		);
	}

	private async onFederationEnabledSettingChange(isFederationEnabled: boolean): Promise<void> {
		if (!this.isRunning) {
			return;
		}

		if (isFederationEnabled) {
			await this.onDisableFederation();
			await this.onEnableFederation();
			await this.verifyConfiguration();
			return;
		}

		return this.onDisableFederation();
	}

	public async initialize() {
		this.internalSettingsAdapter = FederationFactory.buildInternalSettingsAdapter();
		await this.internalSettingsAdapter.initialize();
		this.cancelSettingsObserver = this.internalSettingsAdapter.onFederationEnabledStatusChanged(
			this.onFederationEnabledSettingChange.bind(this),
		);
	}

	private async noop(): Promise<void> {
		// noop
	}

	private async setupEventHandlersForExternalEvents(): Promise<void> {
		const federationRoomServiceReceiver = FederationFactory.buildRoomServiceReceiver(
			this.internalRoomAdapter,
			this.internalUserAdapter,
			this.internalMessageAdapter,
			this.internalFileAdapter,
			this.internalSettingsAdapter,
			this.internalNotificationAdapter,
			this.internalQueueInstance,
			this.bridge,
		);
		const federationMessageServiceReceiver = FederationFactory.buildMessageServiceReceiver(
			this.internalRoomAdapter,
			this.internalUserAdapter,
			this.internalMessageAdapter,
			this.internalFileAdapter,
			this.internalSettingsAdapter,
			this.bridge,
		);
		const federationUserServiceReceiver = FederationFactory.buildUserServiceReceiver(
			this.internalRoomAdapter,
			this.internalUserAdapter,
			this.internalFileAdapter,
			this.internalNotificationAdapter,
			this.internalSettingsAdapter,
			this.bridge,
		);
		const federationEventsHandler = FederationFactory.buildFederationEventHandler(
			federationRoomServiceReceiver,
			federationMessageServiceReceiver,
			federationUserServiceReceiver,
			this.internalSettingsAdapter,
		);
		this.internalQueueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), this.PROCESSING_CONCURRENCY);
	}

	private canOtherHomeserversFederate(): Promise<boolean> {
		const url = new URL(`https://${this.internalSettingsAdapter.getHomeServerDomain()}`);

		return new Promise((resolve, reject) =>
			fetch(`${federationTesterHost}/api/federation-ok?server_name=${url.host}`)
				.then((response) => response.text())
				.then((text) => resolve(text === 'GOOD'))
				.catch(reject),
		);
	}

	protected getInternalSettingsAdapter(): RocketChatSettingsAdapter {
		return this.internalSettingsAdapter;
	}

	protected getInternalRoomServiceSender(): FederationRoomServiceSender {
		return this.internalRoomServiceSender;
	}

	protected getInternalUserServiceSender(): FederationUserServiceSender {
		return this.internalUserServiceSender;
	}

	protected getInternalRoomAdapter(): RocketChatRoomAdapter {
		return this.internalRoomAdapter;
	}

	protected getInternalUserAdapter(): RocketChatUserAdapter {
		return this.internalUserAdapter;
	}

	protected getInternalMessageAdapter(): RocketChatMessageAdapter {
		return this.internalMessageAdapter;
	}

	protected getInternalNotificationAdapter(): RocketChatNotificationAdapter {
		return this.internalNotificationAdapter;
	}

	protected getInternalFileAdapter(): RocketChatFileAdapter {
		return this.internalFileAdapter;
	}

	protected isFederationEnabled(): boolean {
		return this.internalSettingsAdapter.isFederationEnabled();
	}

	protected async setupFederation(): Promise<void> {
		if (this.isFederationEnabled()) {
			await this.setupEventHandlersForExternalEvents();
			await this.setupInternalValidators();
			await this.setupInternalActionListeners();
			await this.setupInternalEphemeralListeners();
		}
		this.isRunning = true;
	}

	protected async cleanUpSettingObserver(): Promise<void> {
		this.cancelSettingsObserver();
		this.isRunning = false;
	}

	protected async cleanUpHandlers(): Promise<void> {
		this.internalQueueInstance.setHandler(this.noop.bind(this), this.PROCESSING_CONCURRENCY);
	}

	protected async verifyMatrixIds(matrixIds: string[]): Promise<Map<string, string>> {
		return this.bridge.verifyInviteeIds(matrixIds);
	}

	public async configurationStatus(): Promise<FederationConfigurationStatus> {
		const status: FederationConfigurationStatus = {
			appservice: {
				roundTrip: { durationMs: -1 },
				ok: false,
			},
			externalReachability: {
				ok: false,
			},
		};

		try {
			const pingResponse = await this.bridge.ping();
			status.appservice.roundTrip.durationMs = pingResponse.durationMs;
			status.appservice.ok = true;
		} catch (error) {
			if (error instanceof IncomingMessage) {
				if (error.statusCode === 404) {
					status.appservice.error = 'homeserver version must be >=1.84.x';
				} else {
					status.appservice.error = `received unknown status from homeserver, message: ${error.statusMessage}`;
				}
			} else {
				status.appservice.error = extractError(error);
			}
		}

		try {
			status.externalReachability.ok = await this.canOtherHomeserversFederate();
		} catch (error) {
			status.externalReachability.error = extractError(error);
		}

		return status;
	}

	public async markConfigurationValid(): Promise<void> {
		return this.internalSettingsAdapter.setConfigurationStatus('Valid');
	}

	public async markConfigurationInvalid(): Promise<void> {
		return this.internalSettingsAdapter.setConfigurationStatus('Invalid');
	}

	public async verifyConfiguration(): Promise<void> {
		try {
			await this.bridge?.ping(); // throws error if fails

			if (!(await this.canOtherHomeserversFederate())) {
				throw new Error('External reachability could not be verified');
			}

			void this.markConfigurationValid();
		} catch (error) {
			federationServiceLogger.error(error);

			void this.markConfigurationInvalid();
		}
	}

	public async beforeCreateRoom(room: Partial<IRoom>): Promise<void> {
		if (!isRoomFederated(room)) {
			return;
		}

		throwIfFederationNotEnabledOrNotReady();
	}

	protected async deactivateRemoteUser(remoteUserId: string): Promise<void> {
		return this.bridge.deactivateUser(remoteUserId);
	}
}

abstract class AbstractBaseFederationService extends AbstractFederationService {
	constructor() {
		const internalQueueInstance = FederationFactory.buildFederationQueue();
		const internalSettingsAdapter = FederationFactory.buildInternalSettingsAdapter();
		const bridge = FederationFactory.buildFederationBridge(internalSettingsAdapter, internalQueueInstance);

		super(bridge, internalQueueInstance, internalSettingsAdapter);
	}

	protected async setupInternalEphemeralListeners(): Promise<void> {
		await this.getInternalNotificationAdapter().subscribeToUserTypingEventsOnFederatedRooms(
			this.getInternalNotificationAdapter().broadcastUserTypingOnRoom.bind(this.getInternalNotificationAdapter()),
		);
	}

	protected async setupInternalValidators(): Promise<void> {
		const federationRoomInternalValidator = FederationFactory.buildRoomInternalValidator(
			this.getInternalRoomAdapter(),
			this.getInternalUserAdapter(),
			this.getInternalFileAdapter(),
			this.getInternalSettingsAdapter(),
			this.bridge,
		);
		FederationFactory.setupValidators(federationRoomInternalValidator);
	}

	protected async setupInternalActionListeners(): Promise<void> {
		const federationMessageServiceSender = FederationFactory.buildMessageServiceSender(
			this.getInternalRoomAdapter(),
			this.getInternalUserAdapter(),
			this.getInternalSettingsAdapter(),
			this.getInternalMessageAdapter(),
			this.bridge,
		);
		FederationFactory.setupListenersForLocalActions(this.getInternalRoomServiceSender(), federationMessageServiceSender);
	}

	protected async onEnableFederation(): Promise<void> {
		await super.setupFederation();
		await this.startFederation();
	}

	protected async onDisableFederation(): Promise<void> {
		await this.stopFederation();
	}

	private async startFederation(): Promise<void> {
		if (!this.isFederationEnabled()) {
			return;
		}
		await this.bridge.start();
		this.bridge.logFederationStartupInfo('Running Federation V2');
		await import('./infrastructure/rocket-chat/slash-commands');
	}

	private async stopFederation(): Promise<void> {
		FederationFactory.removeAllListeners();
		await this.bridge.stop();
		await super.cleanUpHandlers();
	}

	public async stopped(): Promise<void> {
		await this.stopFederation();
		await super.cleanUpSettingObserver();
	}

	public async started(): Promise<void> {
		await super.setupFederation();
		await this.startFederation();
	}
}

export class FederationService extends AbstractBaseFederationService implements IFederationService {
	protected name = 'federation';

	public async createDirectMessageRoomAndInviteUser(
		internalInviterId: string,
		internalRoomId: string,
		externalInviteeId: string,
	): Promise<void> {
		return this.getInternalRoomServiceSender().createDirectMessageRoomAndInviteUser(
			FederationRoomSenderConverter.toCreateDirectMessageRoomDto(internalInviterId, internalRoomId, externalInviteeId),
		);
	}

	public async verifyMatrixIds(matrixIds: string[]): Promise<Map<string, string>> {
		return super.verifyMatrixIds(matrixIds);
	}

	static async createFederationService(): Promise<FederationService> {
		const federationService = new FederationService();
		await federationService.initialize();
		return federationService;
	}

	public async stopped(): Promise<void> {
		return super.stopped();
	}

	public async started(): Promise<void> {
		return super.started();
	}

	public async verifyConfiguration(): Promise<void> {
		return super.verifyConfiguration();
	}

	public async markConfigurationValid(): Promise<void> {
		return super.markConfigurationValid();
	}

	public async markConfigurationInvalid(): Promise<void> {
		return super.markConfigurationInvalid();
	}

	public async configurationStatus(): Promise<FederationConfigurationStatus> {
		return super.configurationStatus();
	}

	public async beforeCreateRoom(room: Partial<IRoom>): Promise<void> {
		return super.beforeCreateRoom(room);
	}

	public async deactivateRemoteUser(userId: string): Promise<void> {
		return super.deactivateRemoteUser(userId);
	}
}
