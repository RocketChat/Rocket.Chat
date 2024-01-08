// TODO: Refactor this file splitting it into smaller files + removing the complexity of the most important method (changeMembership)
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { isDirectMessageRoom, isQuoteAttachment } from '@rocket.chat/core-typings';

import { DirectMessageFederatedRoom, FederatedRoom } from '../../../domain/FederatedRoom';
import { FederatedUser } from '../../../domain/FederatedUser';
import { EVENT_ORIGIN } from '../../../domain/IFederationBridge';
import type { IFederationBridge } from '../../../domain/IFederationBridge';
import { removeExternalSpecificCharsFromExternalIdentifier } from '../../../infrastructure/matrix/converters/room/RoomReceiver';
import type { InMemoryQueue } from '../../../infrastructure/queue/InMemoryQueue';
import type { RocketChatFileAdapter } from '../../../infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from '../../../infrastructure/rocket-chat/adapters/Message';
import type { RocketChatNotificationAdapter } from '../../../infrastructure/rocket-chat/adapters/Notification';
import type { RocketChatRoomAdapter } from '../../../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from '../../../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../../../infrastructure/rocket-chat/adapters/User';
import { AbstractFederationApplicationService } from '../../AbstractFederationApplicationService';
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
	FederationRoomRoomChangePowerLevelsEventDto,
} from '../input/RoomReceiverDto';
import { getMessageRedactionHandler } from '../message/receiver/message-redaction-helper';

export class FederationRoomServiceReceiver extends AbstractFederationApplicationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalMessageAdapter: RocketChatMessageAdapter,
		protected internalFileAdapter: RocketChatFileAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected internalNotificationAdapter: RocketChatNotificationAdapter,
		protected federationQueueInstance: InMemoryQueue,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalFileAdapter, internalSettingsAdapter);
	}

	public async onCreateRoom(roomCreateInput: FederationRoomCreateInputDto): Promise<void> {
		const { externalRoomId, wasInternallyProgramaticallyCreated = false, internalRoomId = '' } = roomCreateInput;
		if (await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId)) {
			return;
		}
		if (!wasInternallyProgramaticallyCreated) {
			return;
		}
		const room = await this.internalRoomAdapter.getInternalRoomById(internalRoomId);
		if (!room || !isDirectMessageRoom(room)) {
			return;
		}
		await this.internalRoomAdapter.updateFederatedRoomByInternalRoomId(internalRoomId, externalRoomId);
	}

	public async onChangeRoomMembership(roomChangeMembershipInput: FederationRoomChangeMembershipDto): Promise<void> {
		const {
			externalRoomId,
			normalizedInviteeId,
			normalizedRoomId,
			normalizedInviterId,
			externalInviteeId,
			externalInviterId,
			inviteeUsernameOnly,
			inviterUsernameOnly,
			eventOrigin,
			roomType,
			leave,
			userProfile,
			allInviteesExternalIdsWhenDM,
			externalRoomName,
			externalEventId,
		} = roomChangeMembershipInput;
		const wasGeneratedOnTheProxyServer = eventOrigin === EVENT_ORIGIN.LOCAL;
		const affectedFederatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		const isUserJoiningByHimself = externalInviterId === externalInviteeId && !leave;

		if (userProfile?.avatarUrl) {
			const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalInviteeId);
			federatedUser && (await this.updateUserAvatarInternally(federatedUser, userProfile?.avatarUrl));
		}
		if (userProfile?.displayName) {
			const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalInviteeId);
			federatedUser && (await this.updateUserDisplayNameInternally(federatedUser, userProfile?.displayName));
		}

		if (wasGeneratedOnTheProxyServer && !isUserJoiningByHimself && !affectedFederatedRoom) {
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

		if (isUserJoiningByHimself) {
			await this.whenUserIsJoiningByHimself(externalRoomId, normalizedRoomId, federatedInviterUser, federatedInviteeUser);
			return;
		}

		if (!wasGeneratedOnTheProxyServer && !affectedFederatedRoom) {
			if (!roomType) {
				return;
			}
			if (isDirectMessageRoom({ t: roomType })) {
				const wereAllInviteesProvidedByCreationalEventAtOnce = allInviteesExternalIdsWhenDM && allInviteesExternalIdsWhenDM.length > 0;
				if (wereAllInviteesProvidedByCreationalEventAtOnce) {
					return this.handleDMRoomInviteWhenAllUsersWereBeingProvidedInTheCreationalEvent(
						allInviteesExternalIdsWhenDM,
						externalRoomId,
						federatedInviterUser,
					);
				}
				return this.handleDMRoomInviteWhenNotifiedByRegularEventsOnly(federatedInviteeUser, federatedInviterUser, externalRoomId);
			}

			const newFederatedRoom = FederatedRoom.createInstance(externalRoomId, normalizedRoomId, federatedInviterUser, roomType);
			const createdInternalRoomId = await this.internalRoomAdapter.createFederatedRoom(newFederatedRoom);

			await this.bridge.joinRoom(externalRoomId, externalInviteeId);
			if (externalRoomName) {
				await this.onChangeRoomName({
					externalRoomId,
					normalizedRoomName: externalRoomName,
					externalEventId,
					externalSenderId: externalInviterId,
					normalizedRoomId,
				});
			}
			await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
				createdInternalRoomId,
				this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
			);
			const roomHistoricalJoinEvents = await this.bridge.getRoomHistoricalJoinEvents(externalRoomId, externalInviteeId, [
				externalInviterId,
				externalInviteeId,
			]);
			roomHistoricalJoinEvents.forEach((event) => this.federationQueueInstance.addToQueue(event));
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
		if (isInviteeFromTheSameHomeServer) {
			await this.bridge.joinRoom(externalRoomId, externalInviteeId);
		}
	}

	private async whenUserIsJoiningByHimself(
		externalRoomId: string,
		normalizedRoomId: string,
		federatedInviterUser: FederatedUser,
		federatedInviteeUser: FederatedUser,
	): Promise<void> {
		const room = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (room) {
			await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
				room.getInternalId(),
				this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
			);
			const inviteeAlreadyJoinedTheInternalRoom = await this.internalRoomAdapter.isUserAlreadyJoined(
				room.getInternalId(),
				federatedInviteeUser.getInternalId(),
			);
			if (inviteeAlreadyJoinedTheInternalRoom) {
				return;
			}
			await this.internalRoomAdapter.addUserToRoom(room, federatedInviteeUser);
			return;
		}

		const externalRoomData = await this.bridge.getRoomData(federatedInviterUser.getExternalId(), externalRoomId);
		if (!externalRoomData) {
			return;
		}

		const creatorUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalRoomData.creator.id);
		const roomCreationProcessIsRunningLocallyAlready =
			!room && creatorUser && federatedInviterUser.getInternalId() === creatorUser.getInternalId();
		if (roomCreationProcessIsRunningLocallyAlready) {
			return;
		}

		if (!creatorUser) {
			await this.createFederatedUserAndReturnIt(externalRoomData.creator.id, externalRoomData.creator.username);
		}
		const federatedCreatorUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalRoomData.creator.id);
		if (!federatedCreatorUser) {
			return;
		}
		const isRoomFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(externalRoomId),
			this.internalHomeServerDomain,
		);
		const newFederatedRoom = FederatedRoom.createInstance(
			externalRoomId,
			normalizedRoomId,
			federatedCreatorUser,
			RoomType.CHANNEL,
			isRoomFromTheSameHomeServer ? externalRoomData.name : undefined,
		);
		const createdInternalRoomId = await this.internalRoomAdapter.createFederatedRoom(newFederatedRoom);
		if (!isRoomFromTheSameHomeServer && externalRoomData.name) {
			await this.onChangeRoomName({
				externalRoomId,
				normalizedRoomName: externalRoomData.name,
				externalEventId: '',
				externalSenderId: federatedCreatorUser.getExternalId(),
				normalizedRoomId,
			});
		}
		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}
		// Do not need to await this, this can be done in parallel
		void this.createFederatedUsersForRoomMembers(
			federatedRoom,
			externalRoomData.joinedMembers,
			externalRoomData.creator.id,
			federatedInviteeUser.getExternalId(),
		);
		await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
			createdInternalRoomId,
			this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
		);
		await this.internalRoomAdapter.addUserToRoom(federatedRoom, federatedInviteeUser);
	}

	private async createFederatedUserAndReturnIt(externalUserId: string, externalUsername?: string): Promise<FederatedUser> {
		const user = await this.internalUserAdapter.getFederatedUserByExternalId(externalUserId);
		if (user) {
			return user;
		}
		const isUserFromTheSameHomeserver = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(externalUserId),
			this.internalHomeServerDomain,
		);
		const existsOnlyOnProxyServer = isUserFromTheSameHomeserver;
		const localUsername = externalUsername || removeExternalSpecificCharsFromExternalIdentifier(externalUserId);
		const username = isUserFromTheSameHomeserver ? localUsername : removeExternalSpecificCharsFromExternalIdentifier(externalUserId); // TODO: move these common functions to a proper layer
		await this.createFederatedUserInternallyOnly(externalUserId, username, existsOnlyOnProxyServer);

		return (await this.internalUserAdapter.getFederatedUserByExternalId(externalUserId)) as FederatedUser;
	}

	private async createFederatedUsersForRoomMembers(
		federatedRoom: FederatedRoom,
		externalMembersExternalIds: string[],
		creatorExternalId: string,
		myselfExternalId: string,
	): Promise<void> {
		const membersExcludingOnesInvolvedInTheCreationProcess = externalMembersExternalIds.filter(
			(externalMemberId) => externalMemberId !== creatorExternalId && externalMemberId !== myselfExternalId,
		);

		const federatedUsers = await Promise.all(
			membersExcludingOnesInvolvedInTheCreationProcess.map((externalMemberId) => this.createFederatedUserAndReturnIt(externalMemberId)),
		);
		await this.internalRoomAdapter.addUsersToRoomWhenJoinExternalPublicRoom(
			federatedUsers.filter(Boolean) as FederatedUser[],
			federatedRoom,
		);
	}

	private async handleDMRoomInviteWhenAllUsersWereBeingProvidedInTheCreationalEvent(
		allInviteesExternalIds: {
			externalInviteeId: string;
			normalizedInviteeId: string;
			inviteeUsernameOnly: string;
		}[],
		externalRoomId: string,
		federatedInviterUser: FederatedUser,
	): Promise<void> {
		const allInvitees = await Promise.all(
			allInviteesExternalIds.map(async (dmExternalInviteeId) => {
				const invitee = await this.internalUserAdapter.getFederatedUserByExternalId(dmExternalInviteeId.externalInviteeId);
				if (!invitee) {
					const isDMInviteeFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
						this.bridge.extractHomeserverOrigin(dmExternalInviteeId.externalInviteeId),
						this.internalHomeServerDomain,
					);
					const dmInviteeUsername = isDMInviteeFromTheSameHomeServer
						? dmExternalInviteeId.inviteeUsernameOnly
						: dmExternalInviteeId.normalizedInviteeId;
					await this.createFederatedUserInternallyOnly(
						dmExternalInviteeId.externalInviteeId,
						dmInviteeUsername,
						isDMInviteeFromTheSameHomeServer,
					);
				}
				return (invitee ||
					(await this.internalUserAdapter.getFederatedUserByExternalId(dmExternalInviteeId.externalInviteeId))) as FederatedUser;
			}),
		);
		const newFederatedRoom = DirectMessageFederatedRoom.createInstance(externalRoomId, federatedInviterUser, [
			federatedInviterUser,
			...allInvitees,
		]);
		const createdInternalRoomId = await this.internalRoomAdapter.createFederatedRoomForDirectMessage(newFederatedRoom);
		await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
			createdInternalRoomId,
			this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
		);
		await Promise.all(
			allInvitees
				.filter((invitee) =>
					FederatedUser.isOriginalFromTheProxyServer(
						this.bridge.extractHomeserverOrigin(invitee.getExternalId()),
						this.internalHomeServerDomain,
					),
				)
				.map((invitee) => this.bridge.joinRoom(externalRoomId, invitee.getExternalId())),
		);
	}

	private async handleDMRoomInviteWhenNotifiedByRegularEventsOnly(
		federatedInviteeUser: FederatedUser,
		federatedInviterUser: FederatedUser,
		externalRoomId: string,
	): Promise<void> {
		const members = [federatedInviterUser, federatedInviteeUser];
		const newFederatedRoom = DirectMessageFederatedRoom.createInstance(externalRoomId, federatedInviterUser, members);
		const createdInternalRoomId = await this.internalRoomAdapter.createFederatedRoomForDirectMessage(newFederatedRoom);
		const isInviteeFromTheSameHomeServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(federatedInviteeUser.getExternalId()),
			this.internalHomeServerDomain,
		);
		await this.internalNotificationAdapter.subscribeToUserTypingEventsOnFederatedRoomId(
			createdInternalRoomId,
			this.internalNotificationAdapter.broadcastUserTypingOnRoom.bind(this.internalNotificationAdapter),
		);
		if (isInviteeFromTheSameHomeServer) {
			await this.bridge.joinRoom(externalRoomId, federatedInviteeUser.getExternalId());
		}
	}

	public async onExternalMessageReceived(roomReceiveExternalMessageInput: FederationRoomReceiveExternalMessageDto): Promise<void> {
		const { externalRoomId, externalSenderId, rawMessage, externalFormattedText, externalEventId, replyToEventId } =
			roomReceiveExternalMessageInput;
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
				externalFormattedText,
				rawMessage,
				externalEventId,
				messageToReplyTo,
				this.internalHomeServerDomain,
			);
			return;
		}

		await this.internalMessageAdapter.sendMessage(
			senderUser,
			federatedRoom,
			rawMessage,
			externalFormattedText,
			externalEventId,
			this.internalHomeServerDomain,
		);
	}

	public async onExternalMessageEditedReceived(roomEditExternalMessageInput: FederationRoomEditExternalMessageDto): Promise<void> {
		const { externalRoomId, externalSenderId, editsEvent, newExternalFormattedText, newRawMessage } = roomEditExternalMessageInput;

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

		// TODO: leaked business logic, move this to its proper place
		const isAQuotedMessage = message.attachments?.some((attachment) => isQuoteAttachment(attachment) && Boolean(attachment.message_link));
		if (isAQuotedMessage) {
			const wasGeneratedLocally = FederatedUser.isOriginalFromTheProxyServer(
				this.bridge.extractHomeserverOrigin(externalSenderId),
				this.internalHomeServerDomain,
			);
			if (wasGeneratedLocally) {
				return;
			}
			const internalFormattedMessageToBeEdited = await this.internalMessageAdapter.getMessageToEditWhenReplyAndQuote(
				message,
				newExternalFormattedText,
				newRawMessage,
				this.internalHomeServerDomain,
				senderUser,
			);
			// TODO: create an entity to abstract all the message logic
			if (!FederatedRoom.shouldUpdateMessage(internalFormattedMessageToBeEdited, message)) {
				return;
			}
			await this.internalMessageAdapter.editQuotedMessage(
				senderUser,
				newRawMessage,
				newExternalFormattedText,
				message,
				this.internalHomeServerDomain,
			);
			return;
		}
		if (!FederatedRoom.shouldUpdateMessage(newRawMessage, message)) {
			return;
		}

		await this.internalMessageAdapter.editMessage(
			senderUser,
			newRawMessage,
			newExternalFormattedText,
			message,
			this.internalHomeServerDomain,
		);
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

		const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!federatedUser) {
			return;
		}
		const shouldUseExternalRoomIdAsRoomName = !FederatedRoom.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(externalRoomId),
			this.internalHomeServerDomain,
		);
		if (shouldUseExternalRoomIdAsRoomName && federatedRoom.shouldUpdateRoomName(externalRoomId)) {
			federatedRoom.changeRoomName(externalRoomId);
			await this.internalRoomAdapter.updateRoomName(federatedRoom);
		}
		if (!federatedRoom.shouldUpdateDisplayRoomName(normalizedRoomName)) {
			return;
		}

		federatedRoom.changeDisplayRoomName(normalizedRoomName);

		await this.internalRoomAdapter.updateDisplayRoomName(federatedRoom, federatedUser);
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
		const handler = await getMessageRedactionHandler(this.internalMessageAdapter, redactsEvent, federatedUser);
		if (!handler) {
			return;
		}
		await handler.handle();
	}

	public async onChangeRoomPowerLevels(roomPowerLevelsInput: FederationRoomRoomChangePowerLevelsEventDto): Promise<void> {
		const { externalRoomId, roleChangesToApply = {}, externalSenderId } = roomPowerLevelsInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUserWhoChangedThePermission = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!federatedUserWhoChangedThePermission) {
			return;
		}

		const federatedUsers = await this.internalUserAdapter.getFederatedUsersByExternalIds(Object.keys(roleChangesToApply));

		await Promise.all(
			federatedUsers.map((targetFederatedUser) => {
				const changes = roleChangesToApply[targetFederatedUser.getExternalId()];
				if (!changes) {
					return;
				}
				const rolesToRemove = changes.filter((change) => change.action === 'remove').map((change) => change.role);
				const rolesToAdd = changes.filter((change) => change.action === 'add').map((change) => change.role);

				return this.internalRoomAdapter.applyRoomRolesToUser({
					federatedRoom,
					targetFederatedUser,
					fromUser: federatedUserWhoChangedThePermission,
					rolesToAdd,
					rolesToRemove,
					notifyChannel: true,
				});
			}),
		);
	}

	public async onExternalThreadedMessageReceived(roomReceiveExternalMessageInput: FederationRoomReceiveExternalMessageDto): Promise<void> {
		const { externalRoomId, externalSenderId, rawMessage, externalFormattedText, externalEventId, replyToEventId, thread } =
			roomReceiveExternalMessageInput;
		if (!thread?.rootEventId) {
			return;
		}

		const parentMessage = await this.internalMessageAdapter.getMessageByFederationId(thread.rootEventId);
		if (!parentMessage) {
			return;
		}

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
			await this.internalMessageAdapter.sendThreadQuoteMessage(
				senderUser,
				federatedRoom,
				rawMessage,
				externalEventId,
				messageToReplyTo,
				this.internalHomeServerDomain,
				parentMessage._id,
				externalFormattedText,
			);
			return;
		}

		await this.internalMessageAdapter.sendThreadMessage(
			senderUser,
			federatedRoom,
			rawMessage,
			externalEventId,
			parentMessage._id,
			externalFormattedText,
			this.internalHomeServerDomain,
		);
	}

	public async onExternalThreadedFileMessageReceived(
		roomReceiveExternalMessageInput: FederationRoomReceiveExternalFileMessageDto,
	): Promise<void> {
		const { externalRoomId, externalSenderId, messageBody, externalEventId, replyToEventId, thread } = roomReceiveExternalMessageInput;

		if (!thread?.rootEventId) {
			return;
		}

		const parentMessage = await this.internalMessageAdapter.getMessageByFederationId(thread.rootEventId);
		if (!parentMessage) {
			return;
		}

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
			await this.internalMessageAdapter.sendThreadQuoteFileMessage(
				senderUser,
				federatedRoom,
				files,
				attachments,
				externalEventId,
				messageToReplyTo,
				this.internalHomeServerDomain,
				parentMessage._id,
			);
			return;
		}

		await this.internalMessageAdapter.sendThreadFileMessage(
			senderUser,
			federatedRoom,
			files,
			attachments,
			externalEventId,
			parentMessage._id,
		);
	}
}
