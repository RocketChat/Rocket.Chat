import { License, ServiceClassInternal } from '@rocket.chat/core-services';
import type { IFederationJoinExternalPublicRoomInput, IFederationService } from '@rocket.chat/core-services';
import type { FederationPaginatedResult, IFederationPublicRooms } from '@rocket.chat/rest-typings';

import type { InMemoryQueue } from './infrastructure/queue/InMemoryQueue';
import type { IFederationBridge } from './domain/IFederationBridge';
import type { RocketChatSettingsAdapter } from './infrastructure/rocket-chat/adapters/Settings';
import type { FederationRoomServiceSender } from './application/room/sender/RoomServiceSender';
import type { FederationUserServiceSender } from './application/user/sender/UserServiceSender';
import type { RocketChatRoomAdapter } from './infrastructure/rocket-chat/adapters/Room';
import type { RocketChatUserAdapter } from './infrastructure/rocket-chat/adapters/User';
import type { RocketChatFileAdapter } from './infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from './infrastructure/rocket-chat/adapters/Message';
import type { RocketChatNotificationAdapter } from './infrastructure/rocket-chat/adapters/Notification';
import { FederationRoomSenderConverter } from './infrastructure/rocket-chat/converters/RoomSender';
import { FederationHooks } from './infrastructure/rocket-chat/hooks';
import { FederationFactory } from './infrastructure/Factory';
import type { FederationDirectMessageRoomServiceSender } from './application/room/sender/DirectMessageRoomServiceSender';
import { FederationSearchPublicRoomsInputDto } from './application/room/input/RoomInputDto';
import type { FederationUserService } from './application/user/UserService';

export class FederationService extends ServiceClassInternal implements IFederationService {
	protected name = 'federation';

	private cancelSettingsObserver: () => void;

	private internalQueueInstance: InMemoryQueue;

	private internalSettingsAdapter: RocketChatSettingsAdapter;

	private internalRoomServiceSender: FederationRoomServiceSender;

	private internalUserServiceSender: FederationUserServiceSender;

	private internalUserService: FederationUserService;

	private internalRoomAdapter: RocketChatRoomAdapter;

	private internalUserAdapter: RocketChatUserAdapter;

	private internalFileAdapter: RocketChatFileAdapter;

	private internalMessageAdapter: RocketChatMessageAdapter;

	private internalNotificationAdapter: RocketChatNotificationAdapter;

	private directMessageRoomServiceSender: FederationDirectMessageRoomServiceSender;

	private isRunning = false;

	protected PROCESSING_CONCURRENCY = 1;

	protected bridge: IFederationBridge;

	constructor() {
		super();
		const internalQueueInstance = FederationFactory.buildFederationQueue();
		const internalSettingsAdapter = FederationFactory.buildInternalSettingsAdapter();
		const bridge = FederationFactory.buildFederationBridge(internalSettingsAdapter, internalQueueInstance);

		this.internalQueueInstance = internalQueueInstance;
		this.internalSettingsAdapter = internalSettingsAdapter;
		this.bridge = bridge;
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
			FederationFactory.buildInternalQueueAdapter(),
			this.bridge,
		);
		this.internalUserServiceSender = FederationFactory.buildUserServiceSender(
			this.internalRoomAdapter,
			this.internalUserAdapter,
			this.internalFileAdapter,
			this.internalSettingsAdapter,
			this.bridge,
		);
		this.directMessageRoomServiceSender = FederationFactory.buildDirectMessageRoomServiceSender(
			this.internalRoomAdapter,
			this.internalUserAdapter,
			this.internalFileAdapter,
			this.internalSettingsAdapter,
			this.bridge,
		);
		this.internalUserService = FederationFactory.buildUserService(
			this.internalSettingsAdapter,
			this.internalUserAdapter,
			this.internalFileAdapter,
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

		this.onEvent('license.module', async ({ module, valid }) => {
			if (module !== 'federation') {
				return;
			}
			if (valid) {
				await this.onValidEnterpriseLicenseAdded();
			}
		});
	}

	protected isFederationEnabled(): boolean {
		return this.internalSettingsAdapter.isFederationEnabled();
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
		const federationEventsHandler = FederationFactory.buildFederationEventHandler(
			federationRoomServiceReceiver,
			federationMessageServiceReceiver,
			federationUserServiceReceiver,
			this.internalSettingsAdapter,
		);
		this.internalQueueInstance.setHandler(federationEventsHandler.handleEvent.bind(federationEventsHandler), this.PROCESSING_CONCURRENCY);
	}

	private async hasValidLicense(): Promise<boolean> {
		return License.hasLicense('federation');
	}

	private async checkRequiredLicense(): Promise<void> {
		if (!(await this.hasValidLicense())) {
			throw new Error('Federation Enterprise is not enabled');
		}
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

	protected async setupInternalEphemeralListeners(): Promise<void> {
		await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRooms(
			this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
		);
	}

	protected async setupInternalValidators(): Promise<void> {
		const federationRoomInternalValidator = FederationFactory.buildRoomInternalValidator(
			this.internalRoomAdapter,
			this.internalUserAdapter,
			this.internalFileAdapter,
			this.internalSettingsAdapter,
			this.bridge,
		);
		FederationFactory.setupValidators(federationRoomInternalValidator);
	}

	protected async setupInternalActionListeners(): Promise<void> {
		const federationMessageServiceSender = FederationFactory.buildMessageServiceSender(
			this.internalRoomAdapter,
			this.internalUserAdapter,
			this.internalSettingsAdapter,
			this.internalMessageAdapter,
			this.bridge,
		);
		FederationFactory.setupListenersForLocalActions(this.internalRoomServiceSender, federationMessageServiceSender);
	}

	protected async onEnableFederation(): Promise<void> {
		await this.setupFederation();
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
		const { addDefaultFederationSlashCommand } = await import('./infrastructure/rocket-chat/slash-commands');
		addDefaultFederationSlashCommand();
	}

	private async stopFederation(): Promise<void> {
		FederationHooks.removeAllListeners();
		await this.bridge.stop();
		await this.cleanUpHandlers();
	}

	public async stopped(): Promise<void> {
		await this.stopFederation();
		await this.cleanUpSettingObserver();
	}

	public async created(): Promise<void> {
		await this.setupFederation();
		await this.startFederation();
	}

	public async createDirectMessageRoomAndInviteUser(
		internalInviterId: string,
		internalRoomId: string,
		externalInviteeId: string,
	): Promise<void> {
		return this.internalRoomServiceSender.createDirectMessageRoomAndInviteUser(
			FederationRoomSenderConverter.toCreateDirectMessageRoomDto(internalInviterId, internalRoomId, externalInviteeId),
		);
	}

	static async createFederationService(): Promise<FederationService> {
		const federationService = new FederationService();
		await federationService.initialize();
		return federationService;
	}

	private async onValidEnterpriseLicenseAdded(): Promise<void> {
		FederationFactory.setupListenersForLocalActionsWhenValidLicense(
			this.internalRoomServiceSender,
			this.directMessageRoomServiceSender,
			this.internalSettingsAdapter,
		);
		const { addDMMultipleFederationSlashCommand } = await import('./infrastructure/rocket-chat/slash-commands');
		addDMMultipleFederationSlashCommand();
		FederationHooks.removeFreeValidation();
		// TODO: add also the EE endpoints
	}

	public async createDirectMessageRoom(internalUserId: string, invitees: string[]): Promise<void> {
		await this.checkRequiredLicense();
		await this.directMessageRoomServiceSender.createInternalLocalDirectMessageRoom(
			FederationRoomSenderConverter.toCreateDirectMessageDto(internalUserId, invitees),
		);
	}

	public async searchPublicRooms(
		serverName?: string,
		roomName?: string,
		pageToken?: string,
		count?: number,
	): Promise<
		FederationPaginatedResult<{
			rooms: IFederationPublicRooms[];
		}>
	> {
		await this.checkRequiredLicense();
		return this.internalRoomServiceSender.searchPublicRooms(
			new FederationSearchPublicRoomsInputDto({
				serverName,
				roomName,
				pageToken,
				count,
			}),
		);
	}

	public async getSearchedServerNamesByInternalUserId(
		internalUserId: string,
	): Promise<{ name: string; default: boolean; local: boolean }[]> {
		await this.checkRequiredLicense();
		return this.internalUserService.getSearchedServerNamesByInternalUserId(internalUserId);
	}

	public async addSearchedServerNameByInternalUserId(internalUserId: string, serverName: string): Promise<void> {
		await this.checkRequiredLicense();
		return this.internalUserService.addSearchedServerNameByInternalUserId(internalUserId, serverName);
	}

	public async removeSearchedServerNameByInternalUserId(internalUserId: string, serverName: string): Promise<void> {
		await this.checkRequiredLicense();
		return this.internalUserService.removeSearchedServerNameByInternalUserId(internalUserId, serverName);
	}

	public async scheduleJoinExternalPublicRoom(
		internalUserId: string,
		externalRoomId: string,
		roomName?: string,
		pageToken?: string,
	): Promise<void> {
		await this.checkRequiredLicense();
		await this.internalRoomServiceSender.scheduleJoinExternalPublicRoom(internalUserId, externalRoomId, roomName, pageToken);
	}

	public async joinExternalPublicRoom(input: IFederationJoinExternalPublicRoomInput): Promise<void> {
		await this.checkRequiredLicense();

		const { internalUserId, externalRoomId, roomName, pageToken } = input;
		await this.internalRoomServiceSender.joinExternalPublicRoom(
			FederationRoomSenderConverter.toJoinExternalPublicRoomDto(internalUserId, externalRoomId, roomName, pageToken),
		);
	}
}
