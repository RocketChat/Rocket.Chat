import { License, ServiceClass } from '@rocket.chat/core-services';
import type { IFederationJoinExternalPublicRoomInput, IFederationService } from '@rocket.chat/core-services';
import type { IMessage, IRoom, ISlashCommands, IUser, Username, ValueOf } from '@rocket.chat/core-typings';
import {
	isDirectMessageRoom,
	isEditedMessage,
	isMessageFromMatrixFederation,
	isRoomFederated,
	RoomMemberActions,
} from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
import type { FederationPaginatedResult, IFederationPublicRooms } from '@rocket.chat/rest-typings';

import { FederationSearchPublicRoomsInputDto } from './application/room/input/RoomInputDto';
import type { FederationMessageServiceSender } from './application/room/message/sender/MessageServiceSender';
import type { FederationDirectMessageRoomServiceSender } from './application/room/sender/DirectMessageRoomServiceSender';
import type { FederationRoomInternalValidator } from './application/room/sender/RoomInternalValidator';
import type { FederationRoomServiceSender } from './application/room/sender/RoomServiceSender';
import type { FederationUserService } from './application/user/UserService';
import type { FederationUserServiceSender } from './application/user/sender/UserServiceSender';
import type { IFederationBridge } from './domain/IFederationBridge';
import { FederationFactory } from './infrastructure/Factory';
import type { InMemoryQueue } from './infrastructure/queue/InMemoryQueue';
import type { IFileAdapterDependencies, RocketChatFileAdapter } from './infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from './infrastructure/rocket-chat/adapters/Message';
import type { RocketChatNotificationAdapter } from './infrastructure/rocket-chat/adapters/Notification';
import type { RocketChatRoomAdapter } from './infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from './infrastructure/rocket-chat/adapters/Settings';
import type { IUserAdapterDependencies, RocketChatUserAdapter } from './infrastructure/rocket-chat/adapters/User';
import { FederationRoomSenderConverter } from './infrastructure/rocket-chat/converters/RoomSender';
import { FederationHooks } from './infrastructure/rocket-chat/hooks';

const allowedActionsInFederatedRooms: ValueOf<typeof RoomMemberActions>[] = [
	RoomMemberActions.REMOVE_USER,
	RoomMemberActions.SET_AS_OWNER,
	RoomMemberActions.SET_AS_MODERATOR,
	RoomMemberActions.INVITE,
	RoomMemberActions.JOIN,
	RoomMemberActions.LEAVE,
];

const allowedActionsForModerators = allowedActionsInFederatedRooms.filter((action) => action !== RoomMemberActions.SET_AS_OWNER);

export class FederationService extends ServiceClass implements IFederationService {
	protected name = 'federation';

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

	private internalMessageServiceSender: FederationMessageServiceSender;

	private internalRoomValidator: FederationRoomInternalValidator;

	private slashCommands: ISlashCommands;

	private isRunning = false;

	protected PROCESSING_CONCURRENCY = 1;

	protected bridge: IFederationBridge;

	private constructor(userAdapterDeps: IUserAdapterDependencies, fileAdapterDeps: IFileAdapterDependencies, slashCommands: ISlashCommands) {
		super();
		const internalQueueInstance = FederationFactory.buildFederationQueue();
		const internalSettingsAdapter = FederationFactory.buildInternalSettingsAdapter();
		const bridge = FederationFactory.buildFederationBridge(internalSettingsAdapter, internalQueueInstance);

		this.internalQueueInstance = internalQueueInstance;
		this.internalSettingsAdapter = internalSettingsAdapter;
		this.slashCommands = slashCommands;
		this.bridge = bridge;
		this.internalFileAdapter = FederationFactory.buildInternalFileAdapter(fileAdapterDeps);
		this.internalRoomAdapter = FederationFactory.buildInternalRoomAdapter();
		this.internalUserAdapter = FederationFactory.buildInternalUserAdapter(userAdapterDeps);
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
		this.internalMessageServiceSender = FederationFactory.buildMessageServiceSender(
			this.internalRoomAdapter,
			this.internalUserAdapter,
			this.internalSettingsAdapter,
			this.internalMessageAdapter,
			this.bridge,
		);
		this.internalRoomValidator = FederationFactory.buildRoomInternalValidator(
			this.internalRoomAdapter,
			this.internalUserAdapter,
			this.internalFileAdapter,
			this.internalSettingsAdapter,
			this.bridge,
		);
	}

	private async setEventListeners(): Promise<void> {
		const internalHomeserverDomain = await this.internalSettingsAdapter.getHomeServerDomain();

		this.onEvent('license.module', async ({ module, valid }) => {
			if (module !== 'federation') {
				return;
			}
			if (valid) {
				await this.onValidEnterpriseLicenseAdded();
			}
		});
		this.onEvent('watch.settings', async ({ clientAction, setting }): Promise<void> => {
			const interestedInSettings = [
				'Federation_Matrix_enabled',
				'Federation_Matrix_id',
				'Federation_Matrix_hs_token',
				'Federation_Matrix_as_token',
				'Federation_Matrix_homeserver_url',
				'Federation_Matrix_homeserver_domain',
				'Federation_Matrix_bridge_url',
				'Federation_Matrix_bridge_localpart',
			];
			if (!interestedInSettings.includes(setting._id) || clientAction === 'removed') {
				return;
			}
			await this.onFederationEnabledSettingChange(await this.isFederationEnabled());
			await this.internalSettingsAdapter.updateRegistrationFile();
		});

		this.onEvent('user.avatarUpdate', async ({ username }): Promise<void> => {
			if (!(await this.isFederationEnabled())) {
				return;
			}
			if (!username) {
				return;
			}
			await this.internalUserServiceSender.afterUserAvatarChanged(username);
		});
		this.onEvent('user.typing', async ({ isTyping, roomId, user: { username } }): Promise<void> => {
			if (!roomId || !username || !(await this.isFederationEnabled())) {
				return;
			}

			await this.internalUserServiceSender.onUserTyping(username, roomId, isTyping);
		});
		this.onEvent('user.realNameChanged', async ({ _id, name }): Promise<void> => {
			if (!(await this.isFederationEnabled())) {
				return;
			}
			if (!name || !_id) {
				return;
			}
			await this.internalUserServiceSender.afterUserRealNameChanged(_id, name);
		});
		this.onEvent('federation.userRoleChanged', async (data: Record<string, any>): Promise<void> => {
			if (!(await this.isFederationEnabled())) {
				return;
			}
			FederationHooks.afterRoomRoleChanged(this.internalRoomServiceSender, data);
		});
		this.onEvent('room.afterUserLeft', async (user: IUser, room: IRoom): Promise<void> => {
			if (!room || !isRoomFederated(room) || !user || !(await this.isFederationEnabled())) {
				return;
			}
			await this.internalRoomServiceSender.afterUserLeaveRoom(FederationRoomSenderConverter.toAfterUserLeaveRoom(user._id, room._id));
		});
		this.onEvent(
			'room.afterRemoveUserFromRoom',
			async (params: { removedUser: IUser; userWhoRemoved: IUser }, room: IRoom | undefined): Promise<void> => {
				if (
					!room ||
					!isRoomFederated(room) ||
					!params ||
					!params.removedUser ||
					!params.userWhoRemoved ||
					!(await this.isFederationEnabled())
				) {
					return;
				}
				await this.internalRoomServiceSender.onUserRemovedFromRoom(
					FederationRoomSenderConverter.toOnUserRemovedFromRoom(params.removedUser._id, room._id, params.userWhoRemoved._id),
				);
			},
		);
		this.onEvent(
			'room.afterSetReaction',
			async (message: IMessage, params: { user: IUser; reaction: string; oldMessage: IMessage }): Promise<void> => {
				if (
					!message ||
					!isMessageFromMatrixFederation(message) ||
					!params ||
					!params.user ||
					!params.reaction ||
					!(await this.isFederationEnabled())
				) {
					return;
				}
				await this.internalMessageServiceSender.sendExternalMessageReaction(message, params.user, params.reaction);
			},
		);
		this.onEvent(
			'room.afterUnsetReaction',
			async (message: IMessage, params: { user: IUser; reaction: string; oldMessage: IMessage }): Promise<void> => {
				if (
					!message ||
					!isMessageFromMatrixFederation(message) ||
					!params ||
					!params.user ||
					!params.reaction ||
					!params.oldMessage ||
					!(await this.isFederationEnabled())
				) {
					return;
				}
				await this.internalMessageServiceSender.sendExternalMessageUnReaction(params.oldMessage, params.user, params.reaction);
			},
		);
		this.onEvent('room.afterDeleteMessage', async (message: IMessage, room: IRoom): Promise<void> => {
			if (!room || !message || !isRoomFederated(room) || !isMessageFromMatrixFederation(message) || !(await this.isFederationEnabled())) {
				return;
			}
			await this.internalRoomServiceSender.afterMessageDeleted(message, room._id);
		});
		this.onEvent('room.afterSaveMessage', async (message: IMessage, room: IRoom): Promise<void> => {
			if (!room || !isRoomFederated(room) || !message || !isMessageFromMatrixFederation(message) || !(await this.isFederationEnabled())) {
				return;
			}
			if (!isEditedMessage(message)) {
				return;
			}
			await this.internalRoomServiceSender.afterMessageUpdated(message, room._id, message.editedBy._id);
		});
		this.onEvent('room.afterSaveMessage', async (message: IMessage, room: IRoom): Promise<void> => {
			if (!room || !isRoomFederated(room) || !message || !(await this.isFederationEnabled())) {
				return;
			}
			if (isEditedMessage(message)) {
				return;
			}
			await this.internalRoomServiceSender.sendExternalMessage(
				FederationRoomSenderConverter.toSendExternalMessageDto(message.u?._id, room._id, message),
			);
		});
		this.onEvent('room.afterRoomNameChange', async (params: { rid: string; name: string; oldName: string }): Promise<void> => {
			if (!params?.rid || !params.name || !(await this.isFederationEnabled())) {
				return;
			}
			await this.internalRoomServiceSender.afterRoomNameChanged(params.rid, params.name);
		});
		this.onEvent('room.afterRoomTopicChange', async (params: { rid: string; topic: string }): Promise<void> => {
			if (!params?.rid || !params.topic || !(await this.isFederationEnabled())) {
				return;
			}
			await this.internalRoomServiceSender.afterRoomTopicChanged(params.rid, params.topic);
		});

		// Requires a license
		this.onEvent('room.onAddUsersToAFederatedRoom', async (params: { invitees: IUser[] | Username[]; inviter: IUser }, room: IRoom) => {
			if (!(await this.hasValidLicense())) {
				return;
			}
			if (!room || !isRoomFederated(room) || !params || !params.invitees || !params.inviter || !(await this.isFederationEnabled())) {
				return;
			}
			await this.internalRoomServiceSender.onUsersAddedToARoom(
				FederationRoomSenderConverter.toOnAddedUsersToARoomDto(
					params.inviter?._id || '',
					params.inviter?.username || '',
					room._id,
					params.invitees,
					internalHomeserverDomain,
				),
			);
		});
		this.onEvent('room.afterCreateFederatedRoom', async (room: IRoom, params: { owner: IUser; originalMemberList: string[] }) => {
			if (!(await this.hasValidLicense())) {
				return;
			}
			if (
				!room ||
				!isRoomFederated(room) ||
				!params ||
				!params.owner ||
				!params.originalMemberList ||
				!(await this.isFederationEnabled())
			) {
				return;
			}
			await this.internalRoomServiceSender.onRoomCreated(
				FederationRoomSenderConverter.toOnRoomCreationDto(
					params.owner._id,
					params.owner.username || '',
					room._id,
					params.originalMemberList,
					internalHomeserverDomain,
				),
			);
		});
		this.onEvent('room.onAddUserToARoom', async (params: { user: IUser; inviter?: IUser }, room: IRoom) => {
			if (!(await this.hasValidLicense())) {
				return;
			}
			if (!room || !isRoomFederated(room) || !params || !params.user || !(await this.isFederationEnabled())) {
				return;
			}
			await this.internalRoomServiceSender.onUsersAddedToARoom(
				FederationRoomSenderConverter.toOnAddedUsersToARoomDto(
					params.inviter?._id || '',
					params.inviter?.username || '',
					room._id,
					[params.user],
					internalHomeserverDomain,
				),
			);
		});
		this.onEvent('room.afterCreateDirectMessageRoom', async (room: IRoom, params: { members: IUser[]; creatorId: IUser['_id'] }) => {
			if (!(await this.hasValidLicense())) {
				return;
			}
			if (!room || !params || !params.creatorId || !params.creatorId || !(await this.isFederationEnabled())) {
				return;
			}
			await this.directMessageRoomServiceSender.onDirectMessageRoomCreation(
				FederationRoomSenderConverter.toOnDirectMessageCreatedDto(params.creatorId, room._id, params.members, internalHomeserverDomain),
			);
		});
		this.onEvent('room.beforeCreateDirectMessageRoom', async (members: IUser[]) => {
			if (!(await this.hasValidLicense())) {
				return;
			}
			if (!members || !(await this.isFederationEnabled())) {
				return;
			}
			await this.directMessageRoomServiceSender.beforeDirectMessageRoomCreation(
				FederationRoomSenderConverter.toBeforeDirectMessageCreatedDto(members, internalHomeserverDomain),
			);
		});
	}

	protected async isFederationEnabled(): Promise<boolean> {
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
		await this.setEventListeners();
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
		if (await this.isFederationEnabled()) {
			await this.setupEventHandlersForExternalEvents();
			await this.setupInternalEphemeralListeners();
		}
		this.isRunning = true;
	}

	protected async shutDownService(): Promise<void> {
		this.isRunning = false;
	}

	protected async cleanUpHandlers(): Promise<void> {
		this.internalQueueInstance.setHandler(this.noop.bind(this), this.PROCESSING_CONCURRENCY);
	}

	protected async setupInternalEphemeralListeners(): Promise<void> {
		await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRooms();
	}

	protected async onEnableFederation(): Promise<void> {
		await this.setupFederation();
		await this.startFederation();
	}

	protected async onDisableFederation(): Promise<void> {
		await this.stopFederation();
	}

	private async startFederation(): Promise<void> {
		if (!(await this.isFederationEnabled())) {
			return;
		}
		await this.bridge.start();
		void this.bridge.logFederationStartupInfo('Running Federation V2');
		const { addDefaultFederationSlashCommand } = await import('./infrastructure/rocket-chat/slash-commands');
		addDefaultFederationSlashCommand(this.slashCommands);
		if (await this.hasValidLicense()) {
			await this.onValidEnterpriseLicenseAdded();
		}
	}

	private async stopFederation(): Promise<void> {
		await this.bridge.stop();
		await this.cleanUpHandlers();
	}

	public async stopped(): Promise<void> {
		await this.stopFederation();
		await this.shutDownService();
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

	static async createFederationService(
		userAdapterDeps: IUserAdapterDependencies,
		fileAdapterDeps: IFileAdapterDependencies,
		slashCommands: ISlashCommands,
	): Promise<FederationService> {
		const federationService = new FederationService(userAdapterDeps, fileAdapterDeps, slashCommands);
		await federationService.initialize();
		return federationService;
	}

	private async onValidEnterpriseLicenseAdded(): Promise<void> {
		const { addDMMultipleFederationSlashCommand } = await import('./infrastructure/rocket-chat/slash-commands');
		addDMMultipleFederationSlashCommand(this.slashCommands);
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

	public async runFederationChecksBeforeAddUserToRoom(
		params: { user: string | IUser; inviter?: IUser | undefined },
		room: IRoom,
	): Promise<void> {
		if (!params?.user || !room) {
			return;
		}
		await this.internalRoomValidator.canAddFederatedUserToNonFederatedRoom(params.user, room);
		if (!(await this.isFederationEnabled()) || !params || !params?.user || !room || !isRoomFederated(room)) {
			return;
		}
		if (await this.hasValidLicense()) {
			await this.internalRoomServiceSender.beforeAddUserToARoom(
				FederationRoomSenderConverter.toBeforeAddUserToARoomDto(
					[params.user],
					room,
					await this.internalSettingsAdapter.getHomeServerDomain(),
					params.inviter,
				),
			);
			return;
		}
		if (params.inviter) {
			await this.internalRoomValidator.canAddFederatedUserToFederatedRoom(params.user, params.inviter, room);
		}
	}

	public async runFederationChecksBeforeCreateDirectMessageRoom(members: (string | IUser)[]): Promise<void> {
		if ((await this.hasValidLicense()) || !members || !(await this.isFederationEnabled())) {
			return;
		}
		await this.internalRoomValidator.canCreateDirectMessageFromUI(members);
	}

	public async actionAllowed(room: IRoom, action: ValueOf<typeof RoomMemberActions>, userId?: IUser['_id']): Promise<boolean> {
		if (!isRoomFederated(room)) {
			return false;
		}
		if (isDirectMessageRoom(room)) {
			return false;
		}
		if (!userId) {
			return true;
		}

		const userSubscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, userId);
		if (!userSubscription) {
			return true;
		}

		if (action === RoomMemberActions.LEAVE) {
			return true;
		}

		if (userSubscription.roles?.includes('owner')) {
			return allowedActionsInFederatedRooms.includes(action);
		}

		if (userSubscription.roles?.includes('moderator')) {
			return allowedActionsForModerators.includes(action);
		}

		return false;
	}

	public async verifyMatrixIds(matrixIds: string[]): Promise<Map<string, string>> {
		return this.bridge.verifyInviteeIds(matrixIds);
	}
}
