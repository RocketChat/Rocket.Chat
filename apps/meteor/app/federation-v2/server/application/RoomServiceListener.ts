import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';

import { DirectMessageFederatedRoom, FederatedRoom } from '../domain/FederatedRoom';
import { FederatedUser } from '../domain/FederatedUser';
import { EVENT_ORIGIN } from '../domain/IFederationBridge';
import type { IFederationBridge } from '../domain/IFederationBridge';
import type { RocketChatMessageAdapter } from '../infrastructure/rocket-chat/adapters/Message';
import type { RocketChatRoomAdapter } from '../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';
import type {
	FederationRoomCreateInputDto,
	FederationRoomChangeMembershipDto,
	FederationRoomReceiveExternalMessageDto,
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
	FederationRoomReceiveExternalFileMessageDto,
	FederationRoomRedactEventDto,
	FederationRoomEditExternalMessageDto,
} from './input/RoomReceiverDto';
import { FederationService } from './AbstractFederationService';
import type { RocketChatFileAdapter } from '../infrastructure/rocket-chat/adapters/File';
import { getRedactMessageHandler } from './RoomRedactionHandlers';
import type { RocketChatNotificationAdapter } from '../infrastructure/rocket-chat/adapters/Notification';

export class FederationRoomServiceListener extends FederationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalMessageAdapter: RocketChatMessageAdapter,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected internalNotificationAdapter: RocketChatNotificationAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	public async onCreateRoom(roomCreateInput: FederationRoomCreateInputDto): Promise<void> {
		const {
			externalRoomId,
			externalInviterId,
			normalizedInviterId,
			externalRoomName,
			normalizedRoomId,
			roomType,
			wasInternallyProgramaticallyCreated = false,
			internalRoomId = '',
		} = roomCreateInput;

		if (await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId)) {
			return;
		}
		if (wasInternallyProgramaticallyCreated) {
			const room = await this.internalRoomAdapter.getInternalRoomById(internalRoomId);
			if (!room || !isDirectMessageRoom(room)) {
				return;
			}
			await this.internalRoomAdapter.updateFederatedRoomByInternalRoomId(internalRoomId, externalRoomId);
			return;
		}

		const creatorUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalInviterId);
		if (!creatorUser) {
			await this.createFederatedUserInternallyOnly(externalInviterId, normalizedInviterId);
		}
		const creator = creatorUser || (await this.internalUserAdapter.getFederatedUserByExternalId(externalInviterId));
		if (!creator) {
			throw new Error('Creator user not found');
		}
		const newFederatedRoom = FederatedRoom.createInstance(
			externalRoomId,
			normalizedRoomId,
			creator,
			roomType || RoomType.CHANNEL,
			externalRoomName,
		);
		const createdInternalRoomId = await this.internalRoomAdapter.createFederatedRoom(newFederatedRoom);
		await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
			createdInternalRoomId,
			this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
		);
	}

	public async onChangeRoomMembership(roomChangeMembershipInput: FederationRoomChangeMembershipDto): Promise<void> {
		const {
			externalRoomId,
			normalizedInviteeId,
			normalizedRoomId,
			normalizedInviterId,
			externalRoomName,
			externalInviteeId,
			externalInviterId,
			inviteeUsernameOnly,
			inviterUsernameOnly,
			eventOrigin,
			roomType,
			leave,
			userProfile,
		} = roomChangeMembershipInput;
		const wasGeneratedOnTheProxyServer = eventOrigin === EVENT_ORIGIN.LOCAL;
		const affectedFederatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);

		if (userProfile?.avatarUrl) {
			const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalInviteeId);
			federatedUser && (await this.updateUserAvatarInternally(federatedUser, userProfile?.avatarUrl));
		}
		if (userProfile?.displayName) {
			const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalInviteeId);
			federatedUser && (await this.updateUserDisplayNameInternally(federatedUser, userProfile?.displayName));
		}

		if (wasGeneratedOnTheProxyServer && !affectedFederatedRoom) {
			return;
		}

		const isInviterFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(externalInviterId),
			this.internalHomeServerDomain,
		);
		const isInviteeFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(externalInviteeId),
			this.internalHomeServerDomain,
		);
		const inviterUsername = isInviterFromTheSameHomeServer ? inviterUsernameOnly : normalizedInviterId;
		const inviteeUsername = isInviteeFromTheSameHomeServer ? inviteeUsernameOnly : normalizedInviteeId;

		const inviterUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalInviterId);
		if (!inviterUser) {
			await this.createFederatedUserInternallyOnly(externalInviterId, inviterUsername, isInviterFromTheSameHomeServer);
		}

		const inviteeUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalInviteeId);
		if (!inviteeUser) {
			await this.createFederatedUserInternallyOnly(externalInviteeId, inviteeUsername, isInviteeFromTheSameHomeServer);
		}
		const federatedInviteeUser = inviteeUser || (await this.internalUserAdapter.getFederatedUserByExternalId(externalInviteeId));
		const federatedInviterUser = inviterUser || (await this.internalUserAdapter.getFederatedUserByExternalId(externalInviterId));

		if (!federatedInviteeUser || !federatedInviterUser) {
			throw new Error('Invitee or inviter user not found');
		}

		if (!wasGeneratedOnTheProxyServer && !affectedFederatedRoom) {
			if (!roomType) {
				return;
			}
			if (isDirectMessageRoom({ t: roomType })) {
				const members = [federatedInviterUser, federatedInviteeUser];
				const newFederatedRoom = DirectMessageFederatedRoom.createInstance(externalRoomId, federatedInviterUser, members);
				const createdInternalRoomId = await this.internalRoomAdapter.createFederatedRoomForDirectMessage(newFederatedRoom);
				await this.bridge.joinRoom(externalRoomId, externalInviteeId);
				await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
					createdInternalRoomId,
					this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
				);
				return;
			}
			const newFederatedRoom = FederatedRoom.createInstance(
				externalRoomId,
				normalizedRoomId,
				federatedInviterUser,
				roomType,
				externalRoomName,
			);

			const createdInternalRoomId = await this.internalRoomAdapter.createFederatedRoom(newFederatedRoom);
			await this.bridge.joinRoom(externalRoomId, externalInviteeId);
			await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
				createdInternalRoomId,
				this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
			);
		}

		const federatedRoom = affectedFederatedRoom || (await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId));
		if (!federatedRoom) {
			return;
		}

		const inviteeAlreadyJoinedTheInternalRoom = await this.internalRoomAdapter.isUserAlreadyJoined(
			federatedRoom.getInternalId(),
			federatedInviteeUser.getInternalId(),
		);
		if (!leave && inviteeAlreadyJoinedTheInternalRoom) {
			return;
		}

		if (leave) {
			const inviteeAlreadyJoinedTheInternalRoom = await this.internalRoomAdapter.isUserAlreadyJoined(
				federatedRoom.getInternalId(),
				federatedInviteeUser.getInternalId(),
			);
			if (!inviteeAlreadyJoinedTheInternalRoom) {
				return;
			}
			await this.internalRoomAdapter.removeUserFromRoom(federatedRoom, federatedInviteeUser, federatedInviterUser);
			return;
		}
		if (!wasGeneratedOnTheProxyServer && federatedRoom.isDirectMessage()) {
			const directMessageRoom = federatedRoom as DirectMessageFederatedRoom;
			if (directMessageRoom.isUserPartOfTheRoom(federatedInviteeUser)) {
				return;
			}
			directMessageRoom.addMember(federatedInviteeUser);
			const newFederatedRoom = DirectMessageFederatedRoom.createInstance(
				externalRoomId,
				federatedInviterUser,
				directMessageRoom.getMembers(),
			);
			await this.internalRoomAdapter.removeDirectMessageRoom(federatedRoom);
			const createdInternalRoomId = await this.internalRoomAdapter.createFederatedRoomForDirectMessage(newFederatedRoom);
			await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
				createdInternalRoomId,
				this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
			);
			return;
		}

		await this.internalRoomAdapter.addUserToRoom(federatedRoom, federatedInviteeUser, federatedInviterUser);
	}

	public async onExternalMessageReceived(roomReceiveExternalMessageInput: FederationRoomReceiveExternalMessageDto): Promise<void> {
		const { externalRoomId, externalSenderId, messageText, externalEventId, replyToEventId } = roomReceiveExternalMessageInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		const senderUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!senderUser) {
			return;
		}
		const message = await this.internalMessageAdapter.getMessageByFederationId(externalEventId);
		if (message) {
			return;
		}

		if (replyToEventId) {
			const messageToReplyTo = await this.internalMessageAdapter.getMessageByFederationId(replyToEventId);
			if (!messageToReplyTo) {
				return;
			}
			await this.internalMessageAdapter.sendQuoteMessage(
				senderUser,
				federatedRoom,
				messageText,
				externalEventId,
				messageToReplyTo,
				this.internalHomeServerDomain,
			);
			return;
		}

		await this.internalMessageAdapter.sendMessage(senderUser, federatedRoom, messageText, externalEventId);
	}

	public async onExternalMessageEditedReceived(roomEditExternalMessageInput: FederationRoomEditExternalMessageDto): Promise<void> {
		const { externalRoomId, externalSenderId, editsEvent, newMessageText } = roomEditExternalMessageInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		const senderUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!senderUser) {
			return;
		}

		const message = await this.internalMessageAdapter.getMessageByFederationId(editsEvent);
		if (!message) {
			return;
		}
		// TODO: create an entity to abstract all the message logic
		if (!FederatedRoom.shouldUpdateMessage(newMessageText, message)) {
			return;
		}

		await this.internalMessageAdapter.editMessage(senderUser, newMessageText, message);
	}

	public async onExternalFileMessageReceived(roomReceiveExternalMessageInput: FederationRoomReceiveExternalFileMessageDto): Promise<void> {
		const { externalRoomId, externalSenderId, messageBody, externalEventId, replyToEventId } = roomReceiveExternalMessageInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		const senderUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!senderUser) {
			return;
		}
		const message = await this.internalMessageAdapter.getMessageByFederationId(externalEventId);
		if (message) {
			return;
		}
		const fileDetails = {
			name: messageBody.filename,
			size: messageBody.size,
			type: messageBody.mimetype,
			rid: federatedRoom.getInternalId(),
			userId: senderUser.getInternalId(),
		};
		const readableStream = await this.bridge.getReadStreamForFileFromUrl(senderUser.getExternalId(), messageBody.url);
		const { files = [], attachments } = await this.internalFileAdapter.uploadFile(
			readableStream,
			federatedRoom.getInternalId(),
			senderUser.getInternalReference(),
			fileDetails,
		);

		if (replyToEventId) {
			const messageToReplyTo = await this.internalMessageAdapter.getMessageByFederationId(replyToEventId);
			if (!messageToReplyTo) {
				return;
			}
			await this.internalMessageAdapter.sendQuoteFileMessage(
				senderUser,
				federatedRoom,
				files,
				attachments,
				externalEventId,
				messageToReplyTo,
				this.internalHomeServerDomain,
			);
			return;
		}

		await this.internalMessageAdapter.sendFileMessage(senderUser, federatedRoom, files, attachments, externalEventId);
	}

	public async onChangeJoinRules(roomJoinRulesChangeInput: FederationRoomChangeJoinRulesDto): Promise<void> {
		const { externalRoomId, roomType } = roomJoinRulesChangeInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		const notAllowedChangeJoinRules = federatedRoom.isDirectMessage();
		if (notAllowedChangeJoinRules) {
			return;
		}

		federatedRoom.changeRoomType(roomType);
		await this.internalRoomAdapter.updateRoomType(federatedRoom);
	}

	public async onChangeRoomName(roomChangeNameInput: FederationRoomChangeNameDto): Promise<void> {
		const { externalRoomId, normalizedRoomName, externalSenderId } = roomChangeNameInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		if (!federatedRoom.shouldUpdateRoomName(normalizedRoomName)) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!federatedUser) {
			return;
		}

		federatedRoom.changeRoomName(normalizedRoomName);

		await this.internalRoomAdapter.updateRoomName(federatedRoom, federatedUser);
	}

	public async onChangeRoomTopic(roomChangeTopicInput: FederationRoomChangeTopicDto): Promise<void> {
		const { externalRoomId, roomTopic, externalSenderId } = roomChangeTopicInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		if (!federatedRoom.shouldUpdateRoomTopic(roomTopic)) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!federatedUser) {
			return;
		}

		federatedRoom.changeRoomTopic(roomTopic);

		await this.internalRoomAdapter.updateRoomTopic(federatedRoom, federatedUser);
	}

	public async onRedactEvent(roomRedactEventInput: FederationRoomRedactEventDto): Promise<void> {
		const { externalRoomId, redactsEvent, externalSenderId } = roomRedactEventInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!federatedUser) {
			return;
		}
		const handler = await getRedactMessageHandler(this.internalMessageAdapter, redactsEvent, federatedUser);
		if (!handler) {
			return;
		}
		await handler.handle();
	}
}
