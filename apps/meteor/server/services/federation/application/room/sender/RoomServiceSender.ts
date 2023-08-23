import type { IMessage, MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { isDeletedMessage, isEditedMessage, isMessageFromMatrixFederation, isQuoteAttachment } from '@rocket.chat/core-typings';

import { FederatedRoom, DirectMessageFederatedRoom } from '../../../domain/FederatedRoom';
import { FederatedUser } from '../../../domain/FederatedUser';
import type { IFederationBridge } from '../../../domain/IFederationBridge';
import { MATRIX_POWER_LEVELS } from '../../../infrastructure/matrix/definitions/MatrixPowerLevels';
import type { RocketChatFileAdapter } from '../../../infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from '../../../infrastructure/rocket-chat/adapters/Message';
import type { RocketChatNotificationAdapter } from '../../../infrastructure/rocket-chat/adapters/Notification';
import type { RocketChatRoomAdapter } from '../../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from '../../../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../../../infrastructure/rocket-chat/adapters/User';
import { ROCKET_CHAT_FEDERATION_ROLES } from '../../../infrastructure/rocket-chat/definitions/FederatedRoomInternalRoles';
import { AbstractFederationApplicationService } from '../../AbstractFederationApplicationService';
import type {
	FederationAfterLeaveRoomDto,
	FederationAfterRemoveUserFromRoomDto,
	FederationCreateDMAndInviteUserDto,
	FederationRoomSendExternalMessageDto,
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

		const isInviteeFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(rawInviteeId),
			this.internalHomeServerDomain,
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
			await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
				createdInternalRoomId,
				this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
			);
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
				await this.bridge.createUser(
					inviteeUsernameOnly,
					federatedInviteeUser.getName() || normalizedInviteeId,
					this.internalHomeServerDomain,
				);
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

		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId()),
			this.internalHomeServerDomain,
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

		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(byWhom.getExternalId()),
			this.internalHomeServerDomain,
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

		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
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

		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
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

		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
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

		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
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

		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
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

		const isUserFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedUser.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
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

		const isRoomFromTheSameHomeServer = FederatedRoom.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedRoom.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
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

		const isRoomFromTheSameHomeServer = FederatedRoom.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedRoom.getExternalId()),
			this.internalSettingsAdapter.getHomeServerDomain(),
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
}
