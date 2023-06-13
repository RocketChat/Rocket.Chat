import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IFederationService } from '@rocket.chat/core-services';

import type { PersistentQueue } from './infrastructure/queue/PersistentQueue';
import type { IFederationBridge } from './domain/IFederationBridge';
import type { RocketChatSettingsAdapter } from './infrastructure/rocket-chat/adapters/Settings';
import type { FederationRoomServiceSender } from './application/room/sender/RoomServiceSender';
import type { FederationUserServiceSender } from './application/user/sender/UserServiceSender';
import type { RocketChatRoomAdapter } from './infrastructure/rocket-chat/adapters/Room';
import type { RocketChatUserAdapter } from './infrastructure/rocket-chat/adapters/User';
import type { RocketChatFileAdapter } from './infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from './infrastructure/rocket-chat/adapters/Message';
import type { RocketChatNotificationAdapter } from './infrastructure/rocket-chat/adapters/Notification';
import type { AbstractMatrixEvent } from './infrastructure/matrix/definitions/AbstractMatrixEvent';
import type { MatrixEventsHandler } from './infrastructure/matrix/handlers';
import { FederationRoomSenderConverter } from './infrastructure/rocket-chat/converters/RoomSender';
import { FederationHooks } from './infrastructure/rocket-chat/hooks';
import { FederationFactory } from './infrastructure/Factory';

export abstract class AbstractFederationService extends ServiceClassInternal {
	private cancelSettingsObserver: () => void;

	private internalQueueInstance: PersistentQueue;

	private internalSettingsAdapter: RocketChatSettingsAdapter;

	private internalRoomServiceSender: FederationRoomServiceSender;

	private internalUserServiceSender: FederationUserServiceSender;

	private internalRoomAdapter: RocketChatRoomAdapter;

	private internalUserAdapter: RocketChatUserAdapter;

	private internalFileAdapter: RocketChatFileAdapter;

	private internalMessageAdapter: RocketChatMessageAdapter;

	private internalNotificationAdapter: RocketChatNotificationAdapter;

	private federationEventsHandler: MatrixEventsHandler;

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
		internalQueueInstance: PersistentQueue,
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
			return this.onEnableFederation();
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
		const federationMessageServiceReceiver = await FederationFactory.buildMessageServiceReceiver(
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
		this.federationEventsHandler = FederationFactory.buildFederationEventHandler(
			federationRoomServiceReceiver,
			federationMessageServiceReceiver,
			federationUserServiceReceiver,
			this.internalSettingsAdapter,
		);
	}

	protected getFederationEventsHandler(): MatrixEventsHandler {
		return this.federationEventsHandler;
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
	}

	public async stopped(): Promise<void> {
		await this.stopFederation();
		await super.cleanUpSettingObserver();
	}

	public async created(): Promise<void> {
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

	public async handleMatrixEvent(event: AbstractMatrixEvent): Promise<void> {
		await this.getFederationEventsHandler().handleEvent(event);
	}

	static async createFederationService(): Promise<FederationService> {
		const federationService = new FederationService();
		await federationService.initialize();
		return federationService;
	}
}
