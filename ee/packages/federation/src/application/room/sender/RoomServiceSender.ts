import type { IMessage, MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { isDeletedMessage, isEditedMessage, isMessageFromMatrixFederation, isQuoteAttachment } from '@rocket.chat/core-typings';
import type { FederationPaginatedResult, IFederationPublicRooms } from '@rocket.chat/rest-typings';

import { FederatedRoom, DirectMessageFederatedRoom } from '../../../domain/FederatedRoom';
import { FederatedUser } from '../../../domain/FederatedUser';
import type { IFederationBridge, IFederationPublicRoomsResult } from '../../../domain/IFederationBridge';
import { MATRIX_POWER_LEVELS } from '../../../infrastructure/matrix/definitions/MatrixPowerLevels';
import { MatrixRoomJoinRules } from '../../../infrastructure/matrix/definitions/MatrixRoomJoinRules';
import type { RocketChatFileAdapter } from '../../../infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from '../../../infrastructure/rocket-chat/adapters/Message';
import type { RocketChatNotificationAdapter } from '../../../infrastructure/rocket-chat/adapters/Notification';
import type { RocketChatQueueAdapter } from '../../../infrastructure/rocket-chat/adapters/Queue';
import type { RocketChatRoomAdapter } from '../../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from '../../../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../../../infrastructure/rocket-chat/adapters/User';
import { ROCKET_CHAT_FEDERATION_ROLES } from '../../../infrastructure/rocket-chat/definitions/FederatedRoomInternalRoles';
import { AbstractFederationApplicationService } from '../../AbstractFederationApplicationService';
import type { FederationJoinExternalPublicRoomInputDto, FederationSearchPublicRoomsInputDto } from '../input/RoomInputDto';
import type {
	FederationAfterLeaveRoomDto,
	FederationAfterRemoveUserFromRoomDto,
	FederationBeforeAddUserToARoomDto,
	FederationCreateDMAndInviteUserDto,
	FederationOnRoomCreationDto,
	FederationOnUsersAddedToARoomDto,
	FederationRoomInviteUserDto,
	FederationRoomSendExternalMessageDto,
	FederationSetupRoomDto,
	IFederationInviteeDto,
} from '../input/RoomSenderDto';
import { getExternalMessageSender } from '../message/sender/message-sender-helper';

export class FederationRoomServiceSender extends AbstractFederationApplicationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalMessageAdapter: RocketChatMessageAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected internalNotificationAdapter: RocketChatNotificationAdapter,
		protected internalQueueAdapter: RocketChatQueueAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	public async createDirectMessageRoomAndInviteUser(roomCreateDMAndInviteUserInput: FederationCreateDMAndInviteUserDto): Promise<void> {
		const { normalizedInviteeId, rawInviteeId, internalInviterId, inviteeUsernameOnly, internalRoomId } = roomCreateDMAndInviteUserInput;

		const internalInviterUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId);
		if (!internalInviterUser) {
			await this.createFederatedUserIncludingHomeserverUsingLocalInformation(internalInviterId);
		}

		const internalInviteeUser = await this.internalUserAdapter.getFederatedUserByInternalId(normalizedInviteeId);
		if (!internalInviteeUser) {
			const existsOnlyOnProxyServer = false;
			await this.createFederatedUserInternallyOnly(rawInviteeId, normalizedInviteeId, existsOnlyOnProxyServer);
		}

		const federatedInviterUser = internalInviterUser || (await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId));
		const federatedInviteeUser =
			internalInviteeUser || (await this.internalUserAdapter.getFederatedUserByInternalUsername(normalizedInviteeId));
		if (!federatedInviterUser || !federatedInviteeUser) {
			throw new Error('Could not find inviter or invitee user');
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isInviteeFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(rawInviteeId, internalHomeServerDomain),
			internalHomeServerDomain,
		);

		const internalFederatedRoom = await this.internalRoomAdapter.getDirectMessageFederatedRoomByUserIds([
			federatedInviteeUser.getInternalId(),
			federatedInviterUser.getInternalId(),
		]);

		if (!internalFederatedRoom) {
			const externalRoomId = await this.bridge.createDirectMessageRoom(
				federatedInviterUser.getExternalId(),
				[federatedInviteeUser.getExternalId()],
				{ internalRoomId },
			);
			const newFederatedRoom = DirectMessageFederatedRoom.createInstance(externalRoomId, federatedInviterUser, [
				federatedInviterUser,
				federatedInviteeUser,
			]);
			const createdInternalRoomId = await this.internalRoomAdapter.createFederatedRoomForDirectMessage(newFederatedRoom);
			await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(createdInternalRoomId);
		}

		const federatedRoom =
			internalFederatedRoom ||
			(await this.internalRoomAdapter.getDirectMessageFederatedRoomByUserIds([
				federatedInviteeUser.getInternalId(),
				federatedInviterUser.getInternalId(),
			]));

		if (!federatedRoom) {
			throw new Error(
				`Could not find room id for users: ${[federatedInviteeUser.getInternalId(), federatedInviterUser.getInternalId()].join(' ')}`,
			);
		}

		if (isInviteeFromTheSameHomeServer) {
			const profile = await this.bridge.getUserProfileInformation(federatedInviteeUser.getExternalId());
			if (!profile) {
				await this.bridge.createUser(inviteeUsernameOnly, federatedInviteeUser.getName() || normalizedInviteeId, internalHomeServerDomain);
			}
			await this.bridge.inviteToRoom(
				federatedRoom.getExternalId(),
				federatedInviterUser.getExternalId(),
				federatedInviteeUser.getExternalId(),
			);
			await this.bridge.joinRoom(federatedRoom.getExternalId(), federatedInviteeUser.getExternalId());
		}

		await this.internalRoomAdapter.addUserToRoom(federatedRoom, federatedInviteeUser, federatedInviterUser);
	}

	public async afterUserLeaveRoom(afterLeaveRoomInput: FederationAfterLeaveRoomDto): Promise<void> {
		const { internalRoomId, internalUserId } = afterLeaveRoomInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			return;
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId(), internalHomeServerDomain),
			internalHomeServerDomain,
		);
		if (!isUserFromTheSameHomeServer) {
			return;
		}

		await this.bridge.leaveRoom(federatedRoom.getExternalId(), federatedUser.getExternalId());
	}

	public async onUserRemovedFromRoom(afterLeaveRoomInput: FederationAfterRemoveUserFromRoomDto): Promise<void> {
		const { internalRoomId, internalUserId, actionDoneByInternalId } = afterLeaveRoomInput;
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			return;
		}

		const byWhom = await this.internalUserAdapter.getFederatedUserByInternalId(actionDoneByInternalId);
		if (!byWhom) {
			return;
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(byWhom.getExternalId(), internalHomeServerDomain),
			internalHomeServerDomain,
		);
		if (!isUserFromTheSameHomeServer) {
			return;
		}

		await this.bridge.kickUserFromRoom(federatedRoom.getExternalId(), federatedUser.getExternalId(), byWhom.getExternalId());
	}

	public async sendExternalMessage(roomSendExternalMessageInput: FederationRoomSendExternalMessageDto): Promise<void> {
		const { internalRoomId, internalSenderId, message, isThreadedMessage } = roomSendExternalMessageInput;
		const federatedSender = await this.internalUserAdapter.getFederatedUserByInternalId(internalSenderId);
		if (!federatedSender) {
			throw new Error(`Could not find user id for ${internalSenderId}`);
		}

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			throw new Error(`Could not find room id for ${internalRoomId}`);
		}

		if (message.federation?.eventId) {
			return;
		}

		if (message.attachments?.some((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link))) {
			// TODO: move this to the domain layer in a proper entity
			const messageLink = (
				message.attachments.find(
					(attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link),
				) as MessageQuoteAttachment
			).message_link;
			if (!messageLink) {
				return;
			}
			const messageToReplyToId = messageLink.includes('msg=') && messageLink?.split('msg=').pop();
			if (!messageToReplyToId) {
				return;
			}
			const messageToReplyTo = await this.internalMessageAdapter.getMessageById(messageToReplyToId);
			if (!messageToReplyTo) {
				return;
			}

			await getExternalMessageSender({
				message,
				isThreadedMessage,
				bridge: this.bridge,
				internalFileAdapter: this.internalFileAdapter,
				internalMessageAdapter: this.internalMessageAdapter,
				internalUserAdapter: this.internalUserAdapter,
			}).sendQuoteMessage(federatedRoom.getExternalId(), federatedSender.getExternalId(), message, messageToReplyTo);
			return;
		}

		await getExternalMessageSender({
			message,
			isThreadedMessage,
			bridge: this.bridge,
			internalFileAdapter: this.internalFileAdapter,
			internalMessageAdapter: this.internalMessageAdapter,
			internalUserAdapter: this.internalUserAdapter,
		}).sendMessage(federatedRoom.getExternalId(), federatedSender.getExternalId(), message);
	}

	public async afterMessageDeleted(internalMessage: IMessage, internalRoomId: string): Promise<void> {
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = internalMessage.u?._id && (await this.internalUserAdapter.getFederatedUserByInternalId(internalMessage.u._id));
		if (!federatedUser) {
			return;
		}

		if (!isMessageFromMatrixFederation(internalMessage) || isDeletedMessage(internalMessage)) {
			return;
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId(), internalHomeServerDomain),
			internalHomeServerDomain,
		);
		if (!isUserFromTheSameHomeServer) {
			return;
		}

		await this.bridge.redactEvent(
			federatedRoom.getExternalId(),
			federatedUser.getExternalId(),
			internalMessage.federation?.eventId as string,
		);
	}

	public async afterMessageUpdated(internalMessage: IMessage, internalRoomId: string, internalUserId: string): Promise<void> {
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			return;
		}
		if (!isMessageFromMatrixFederation(internalMessage) || !isEditedMessage(internalMessage) || internalMessage.u._id !== internalUserId) {
			return;
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId(), internalHomeServerDomain),
			internalHomeServerDomain,
		);
		if (!isUserFromTheSameHomeServer) {
			return;
		}

		await this.bridge.updateMessage(
			federatedRoom.getExternalId(),
			federatedUser.getExternalId(),
			internalMessage.federation?.eventId as string,
			internalMessage.msg,
		);
	}

	public async onRoomOwnerAdded(internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> {
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			return;
		}

		const federatedTargetUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalTargetUserId);
		if (!federatedTargetUser) {
			return;
		}

		const userRoomRoles = await this.internalRoomAdapter.getInternalRoomRolesByUserId(internalRoomId, internalUserId);
		const myself = federatedUser.getInternalId() === federatedTargetUser.getInternalId();
		if (!userRoomRoles?.includes(ROCKET_CHAT_FEDERATION_ROLES.OWNER) && !myself) {
			throw new Error('Federation_Matrix_not_allowed_to_change_owner');
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId(), internalHomeServerDomain),
			internalHomeServerDomain,
		);
		if (!isUserFromTheSameHomeServer) {
			return;
		}
		try {
			await this.bridge.setRoomPowerLevels(
				federatedRoom.getExternalId(),
				federatedUser.getExternalId(),
				federatedTargetUser.getExternalId(),
				MATRIX_POWER_LEVELS.ADMIN,
			);
		} catch (e) {
			await this.rollbackRoomRoles(federatedRoom, federatedTargetUser, federatedUser, [], [ROCKET_CHAT_FEDERATION_ROLES.OWNER]);
		}
	}

	public async onRoomOwnerRemoved(internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> {
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			return;
		}

		const federatedTargetUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalTargetUserId);
		if (!federatedTargetUser) {
			return;
		}

		const userRoomRoles = await this.internalRoomAdapter.getInternalRoomRolesByUserId(internalRoomId, internalUserId);
		const myself = federatedUser.getInternalId() === federatedTargetUser.getInternalId();
		if (!userRoomRoles?.includes(ROCKET_CHAT_FEDERATION_ROLES.OWNER) && !myself) {
			throw new Error('Federation_Matrix_not_allowed_to_change_owner');
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId(), internalHomeServerDomain),
			internalHomeServerDomain,
		);
		if (!isUserFromTheSameHomeServer) {
			return;
		}
		try {
			await this.bridge.setRoomPowerLevels(
				federatedRoom.getExternalId(),
				federatedUser.getExternalId(),
				federatedTargetUser.getExternalId(),
				MATRIX_POWER_LEVELS.USER,
			);
		} catch (e) {
			await this.rollbackRoomRoles(federatedRoom, federatedTargetUser, federatedUser, [ROCKET_CHAT_FEDERATION_ROLES.OWNER], []);
		}
	}

	public async onRoomModeratorAdded(internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> {
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			return;
		}
		const federatedTargetUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalTargetUserId);
		if (!federatedTargetUser) {
			return;
		}

		const userRoomRoles = await this.internalRoomAdapter.getInternalRoomRolesByUserId(internalRoomId, internalUserId);
		const myself = federatedUser.getInternalId() === federatedTargetUser.getInternalId();
		if (
			!userRoomRoles?.includes(ROCKET_CHAT_FEDERATION_ROLES.OWNER) &&
			!userRoomRoles?.includes(ROCKET_CHAT_FEDERATION_ROLES.MODERATOR) &&
			!myself
		) {
			throw new Error('Federation_Matrix_not_allowed_to_change_moderator');
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId(), internalHomeServerDomain),
			internalHomeServerDomain,
		);
		if (!isUserFromTheSameHomeServer) {
			return;
		}

		try {
			await this.bridge.setRoomPowerLevels(
				federatedRoom.getExternalId(),
				federatedUser.getExternalId(),
				federatedTargetUser.getExternalId(),
				MATRIX_POWER_LEVELS.MODERATOR,
			);
		} catch (e) {
			await this.rollbackRoomRoles(federatedRoom, federatedTargetUser, federatedUser, [], [ROCKET_CHAT_FEDERATION_ROLES.MODERATOR]);
		}
	}

	public async onRoomModeratorRemoved(internalUserId: string, internalTargetUserId: string, internalRoomId: string): Promise<void> {
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			return;
		}

		const federatedTargetUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalTargetUserId);
		if (!federatedTargetUser) {
			return;
		}

		const userRoomRoles = await this.internalRoomAdapter.getInternalRoomRolesByUserId(internalRoomId, internalUserId);
		const myself = federatedUser.getInternalId() === federatedTargetUser.getInternalId();
		if (
			!userRoomRoles?.includes(ROCKET_CHAT_FEDERATION_ROLES.OWNER) &&
			!userRoomRoles?.includes(ROCKET_CHAT_FEDERATION_ROLES.MODERATOR) &&
			!myself
		) {
			throw new Error('Federation_Matrix_not_allowed_to_change_moderator');
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId(), internalHomeServerDomain),
			internalHomeServerDomain,
		);
		if (!isUserFromTheSameHomeServer) {
			return;
		}

		try {
			await this.bridge.setRoomPowerLevels(
				federatedRoom.getExternalId(),
				federatedUser.getExternalId(),
				federatedTargetUser.getExternalId(),
				MATRIX_POWER_LEVELS.USER,
			);
		} catch (e) {
			await this.rollbackRoomRoles(federatedRoom, federatedTargetUser, federatedUser, [ROCKET_CHAT_FEDERATION_ROLES.MODERATOR], []);
		}
	}

	public async afterRoomNameChanged(internalRoomId: string, internalRoomName: string): Promise<void> {
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser =
			federatedRoom.getCreatorId() && (await this.internalUserAdapter.getFederatedUserByInternalId(federatedRoom.getCreatorId() as string));
		if (!federatedUser) {
			return;
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isRoomFromTheSameHomeServer = FederatedRoom.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedRoom.getExternalId(), internalHomeServerDomain),
			internalHomeServerDomain,
		);
		if (!isRoomFromTheSameHomeServer) {
			return;
		}

		const externalRoomName = await this.bridge.getRoomName(federatedRoom.getExternalId(), federatedUser.getExternalId());

		if (!federatedRoom.shouldUpdateDisplayRoomName(externalRoomName || '')) {
			return;
		}

		await this.bridge.setRoomName(federatedRoom.getExternalId(), federatedUser.getExternalId(), internalRoomName);
	}

	public async afterRoomTopicChanged(internalRoomId: string, internalRoomTopic: string): Promise<void> {
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser =
			federatedRoom.getCreatorId() && (await this.internalUserAdapter.getFederatedUserByInternalId(federatedRoom.getCreatorId() as string));
		if (!federatedUser) {
			return;
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isRoomFromTheSameHomeServer = FederatedRoom.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedRoom.getExternalId(), internalHomeServerDomain),
			internalHomeServerDomain,
		);
		if (!isRoomFromTheSameHomeServer) {
			return;
		}

		const externalRoomTopic = await this.bridge.getRoomTopic(federatedRoom.getExternalId(), federatedUser.getExternalId());
		if (!federatedRoom.shouldUpdateRoomTopic(externalRoomTopic || '')) {
			return;
		}

		await this.bridge.setRoomTopic(federatedRoom.getExternalId(), federatedUser.getExternalId(), internalRoomTopic);
	}

	private async rollbackRoomRoles(
		federatedRoom: FederatedRoom,
		targetFederatedUser: FederatedUser,
		fromUser: FederatedUser,
		rolesToAdd: ROCKET_CHAT_FEDERATION_ROLES[],
		rolesToRemove: ROCKET_CHAT_FEDERATION_ROLES[],
	): Promise<void> {
		await this.internalRoomAdapter.applyRoomRolesToUser({
			federatedRoom,
			targetFederatedUser,
			fromUser,
			rolesToAdd,
			rolesToRemove,
			notifyChannel: false,
		});
		this.internalNotificationAdapter.notifyWithEphemeralMessage(
			'Federation_Matrix_error_applying_room_roles',
			fromUser.getInternalId(),
			federatedRoom.getInternalId(),
		);
	}

	public async onRoomCreated(roomOnCreationInput: FederationOnRoomCreationDto): Promise<void> {
		const { internalInviterId, internalRoomId, invitees } = roomOnCreationInput;
		await this.setupFederatedRoom({ internalInviterId, internalRoomId });

		if (invitees.length === 0) {
			return;
		}

		await this.inviteLocalThenExternalUsers(invitees, internalInviterId, internalRoomId);
	}

	public async beforeAddUserToARoom(dmBeforeAddUserToARoomInput: FederationBeforeAddUserToARoomDto): Promise<void> {
		const { invitees = [], internalInviter, internalRoomId } = dmBeforeAddUserToARoomInput;
		if (invitees.length === 0) {
			return;
		}
		if (internalInviter) {
			const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviter._id);
			if (!federatedUser) {
				return;
			}

			const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
			if (!federatedRoom) {
				return;
			}
			const userRolesInThisRoom = await this.internalRoomAdapter.getInternalRoomRolesByUserId(
				federatedRoom.getInternalId(),
				federatedUser.getInternalId(),
			);
			const canAddUserToARoom =
				userRolesInThisRoom.includes(ROCKET_CHAT_FEDERATION_ROLES.OWNER) ||
				userRolesInThisRoom.includes(ROCKET_CHAT_FEDERATION_ROLES.MODERATOR) ||
				federatedRoom.isTheCreator(federatedUser.getInternalId());
			if (!canAddUserToARoom) {
				throw new Error('You are not allowed to add users to this room');
			}
		}

		await this.createUsersLocallyOnly(invitees);
	}

	private async inviteLocalThenExternalUsers(
		invitees: IFederationInviteeDto[],
		internalInviterId: string,
		internalRoomId: string,
	): Promise<void> {
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const localUsers = invitees.filter((user) =>
			FederatedUser.isOriginalFromTheProxyServer(
				this.bridge.extractHomeserverOrigin(user.rawInviteeId, internalHomeServerDomain),
				internalHomeServerDomain,
			),
		);

		const externalUsers = invitees.filter(
			(user) =>
				!FederatedUser.isOriginalFromTheProxyServer(
					this.bridge.extractHomeserverOrigin(user.rawInviteeId, internalHomeServerDomain),
					internalHomeServerDomain,
				),
		);

		for await (const user of [...localUsers, ...externalUsers]) {
			await this.inviteUserToAFederatedRoom({
				internalInviterId,
				internalRoomId,
				inviteeUsernameOnly: user.inviteeUsernameOnly,
				normalizedInviteeId: user.normalizedInviteeId,
				rawInviteeId: user.rawInviteeId,
			});
		}
	}

	public async onUsersAddedToARoom(roomOnUsersAddedToARoomInput: FederationOnUsersAddedToARoomDto): Promise<void> {
		const { internalInviterId, internalRoomId, invitees, inviteComesFromAnExternalHomeServer } = roomOnUsersAddedToARoomInput;

		if (inviteComesFromAnExternalHomeServer) {
			return;
		}

		await this.inviteLocalThenExternalUsers(invitees, internalInviterId, internalRoomId);
	}

	public async searchPublicRooms(roomSearchInputDto: FederationSearchPublicRoomsInputDto): Promise<
		FederationPaginatedResult<{
			rooms: IFederationPublicRooms[];
		}>
	> {
		if (!(await this.internalSettingsAdapter.isFederationEnabled())) {
			throw new Error('Federation is disabled');
		}
		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const { serverName, roomName, count, pageToken } = roomSearchInputDto;
		const rooms = await this.bridge.searchPublicRooms({
			serverName: serverName || internalHomeServerDomain,
			roomName,
			limit: count,
			pageToken,
		});

		return RoomMapper.toSearchPublicRoomsDto(
			rooms,
			parseInt((await this.internalSettingsAdapter.getMaximumSizeOfUsersWhenJoiningPublicRooms()) || '0'),
			pageToken,
		);
	}

	public async scheduleJoinExternalPublicRoom(
		internalUserId: string,
		externalRoomId: string,
		roomName?: string,
		pageToken?: string,
	): Promise<void> {
		if (!(await this.internalSettingsAdapter.isFederationEnabled())) {
			throw new Error('Federation is disabled');
		}
		await this.internalQueueAdapter.enqueueJob('federation-enterprise.joinExternalPublicRoom', {
			internalUserId,
			externalRoomId,
			roomName,
			pageToken,
		});
	}

	public async joinExternalPublicRoom(joinExternalPublicRoomInputDto: FederationJoinExternalPublicRoomInputDto): Promise<void> {
		if (!(await this.internalSettingsAdapter.isFederationEnabled())) {
			throw new Error('Federation is disabled');
		}

		const { externalRoomId, internalUserId, externalRoomHomeServerName, roomName, pageToken } = joinExternalPublicRoomInputDto;
		const room = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (room) {
			const alreadyJoined = await this.internalRoomAdapter.isUserAlreadyJoined(room.getInternalId(), internalUserId);
			if (alreadyJoined) {
				throw new Error('already-joined');
			}
		}

		const user = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!user) {
			await this.createFederatedUserIncludingHomeserverUsingLocalInformation(internalUserId);
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			throw new Error(`User with internalId ${internalUserId} not found`);
		}
		if (!(await this.isRoomSizeAllowed(externalRoomId, externalRoomHomeServerName, roomName, pageToken))) {
			throw new Error("Can't join a room bigger than the admin of your workspace has set as the maximum size");
		}

		await this.bridge.joinRoom(externalRoomId, federatedUser.getExternalId(), [externalRoomHomeServerName]);
	}

	private async isRoomSizeAllowed(externalRoomId: string, serverName: string, roomName?: string, pageToken?: string): Promise<boolean> {
		try {
			const rooms = await this.bridge.searchPublicRooms({
				serverName,
				limit: 50,
				roomName,
				pageToken,
			});

			const room = rooms.chunk.find((room) => room.room_id === externalRoomId);
			if (!room) {
				throw new Error("Cannot find the room you're trying to join");
			}
			return room.num_joined_members <= parseInt((await this.internalSettingsAdapter.getMaximumSizeOfUsersWhenJoiningPublicRooms()) || '0');
		} catch (error) {
			throw new Error("Cannot find the room you're trying to join");
		}
	}

	private async setupFederatedRoom(roomInviteUserInput: FederationSetupRoomDto): Promise<void> {
		const { internalInviterId, internalRoomId } = roomInviteUserInput;
		const inviterUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId);
		if (!inviterUser) {
			await this.createFederatedUserIncludingHomeserverUsingLocalInformation(internalInviterId);
		}

		const federatedInviterUser = inviterUser || (await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId));
		if (!federatedInviterUser) {
			throw new Error(`User with internalId ${internalInviterId} not found`);
		}

		const internalFederatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (internalFederatedRoom) {
			return;
		}
		const internalRoom = await this.internalRoomAdapter.getInternalRoomById(internalRoomId);
		if (!internalRoom?.name) {
			throw new Error(`Room with internalId ${internalRoomId} not found`);
		}
		const roomName = internalRoom.fname || internalRoom.name;
		const externalRoomId = await this.bridge.createRoom(federatedInviterUser.getExternalId(), internalRoom.t, roomName, internalRoom.topic);

		await this.internalRoomAdapter.updateFederatedRoomByInternalRoomId(internalRoom._id, externalRoomId);
		await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(internalRoom._id);
	}

	private async inviteUserToAFederatedRoom(roomInviteUserInput: FederationRoomInviteUserDto): Promise<void> {
		const { internalInviterId, internalRoomId, normalizedInviteeId, inviteeUsernameOnly, rawInviteeId } = roomInviteUserInput;
		const isUserAutoJoining = Boolean(!internalInviterId);

		const internalHomeServerDomain = await this.internalSettingsAdapter.getHomeServerDomain();
		const isInviteeFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(rawInviteeId, internalHomeServerDomain),
			internalHomeServerDomain,
		);

		if (isUserAutoJoining && !isInviteeFromTheSameHomeServer) {
			return;
		}

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			throw new Error(`Could not find the room to invite. RoomId: ${internalRoomId}`);
		}

		const federatedInviterUser = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviterId);
		if (!federatedInviterUser && !isUserAutoJoining) {
			throw new Error(`User with internalId ${internalInviterId} not found`);
		}

		const username = isInviteeFromTheSameHomeServer ? inviteeUsernameOnly : normalizedInviteeId;
		const inviteeUser = await this.internalUserAdapter.getFederatedUserByInternalUsername(username);
		if (!inviteeUser) {
			const existsOnlyOnProxyServer = isInviteeFromTheSameHomeServer;
			await this.createFederatedUserInternallyOnly(rawInviteeId, username, existsOnlyOnProxyServer);
		}

		const federatedInviteeUser = inviteeUser || (await this.internalUserAdapter.getFederatedUserByInternalUsername(username));
		if (!federatedInviteeUser) {
			throw new Error(`User with internalUsername ${username} not found`);
		}

		if (isInviteeFromTheSameHomeServer) {
			const profile = await this.bridge.getUserProfileInformation(federatedInviteeUser.getExternalId());
			if (!profile) {
				await this.bridge.createUser(
					inviteeUsernameOnly,
					federatedInviteeUser.getName() || federatedInviteeUser.getUsername() || username,
					internalHomeServerDomain,
				);
			}
		}

		if (!federatedInviterUser && isUserAutoJoining) {
			await this.bridge.joinRoom(federatedRoom.getExternalId(), federatedInviteeUser.getExternalId());
			return;
		}

		if (!federatedInviterUser) {
			throw new Error(`User with internalId ${internalInviterId} not found`);
		}

		await this.bridge.inviteToRoom(
			federatedRoom.getExternalId(),
			federatedInviterUser.getExternalId(),
			federatedInviteeUser.getExternalId(),
		);
		if (isInviteeFromTheSameHomeServer) {
			await this.bridge.joinRoom(federatedRoom.getExternalId(), federatedInviteeUser.getExternalId());
		}
	}
}

class RoomMapper {
	public static toSearchPublicRoomsDto(
		rooms: IFederationPublicRoomsResult,
		maxSizeOfUsersAllowed: number,
		pageToken?: string,
	): FederationPaginatedResult<{
		rooms: IFederationPublicRooms[];
	}> {
		return {
			rooms: (rooms?.chunk || [])
				.filter((room) => room.join_rule && room.join_rule !== MatrixRoomJoinRules.KNOCK)
				.map((room) => ({
					id: room.room_id,
					name: room.name,
					canJoin: room.num_joined_members <= maxSizeOfUsersAllowed,
					canonicalAlias: room.canonical_alias,
					joinedMembers: room.num_joined_members,
					topic: room.topic,
					pageToken,
				})),
			count: rooms?.chunk?.length || 0,
			total: rooms?.total_room_count_estimate || 0,
			...(rooms?.next_batch ? { nextPageToken: rooms.next_batch } : {}),
			...(rooms?.prev_batch ? { prevPageToken: rooms.prev_batch } : {}),
		};
	}
}
