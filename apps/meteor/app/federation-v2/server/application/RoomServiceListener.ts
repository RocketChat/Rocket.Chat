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
} from './input/RoomReceiverDto';
import { FederationService } from './AbstractFederationService';

export class FederationRoomServiceListener extends FederationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalMessageAdapter: RocketChatMessageAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalSettingsAdapter);
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
			await this.createFederatedUser(externalInviterId, normalizedInviterId);
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
		await this.internalRoomAdapter.createFederatedRoom(newFederatedRoom);
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
		} = roomChangeMembershipInput;
		const wasGeneratedOnTheProxyServer = eventOrigin === EVENT_ORIGIN.LOCAL;
		const affectedFederatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);

		if (wasGeneratedOnTheProxyServer && !affectedFederatedRoom) {
			throw new Error(`Could not find room with external room id: ${externalRoomId}`);
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
			await this.createFederatedUser(externalInviterId, inviterUsername, isInviterFromTheSameHomeServer);
		}

		const inviteeUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalInviteeId);
		if (!inviteeUser) {
			await this.createFederatedUser(externalInviteeId, inviteeUsername, isInviteeFromTheSameHomeServer);
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
				await this.internalRoomAdapter.createFederatedRoomForDirectMessage(newFederatedRoom);
				await this.bridge.joinRoom(externalRoomId, externalInviteeId);
				return;
			}
			const newFederatedRoom = FederatedRoom.createInstance(
				externalRoomId,
				normalizedRoomId,
				federatedInviterUser,
				roomType,
				externalRoomName,
			);

			await this.internalRoomAdapter.createFederatedRoom(newFederatedRoom);
			await this.bridge.joinRoom(externalRoomId, externalInviteeId);
		}

		const federatedRoom = affectedFederatedRoom || (await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId));
		if (!federatedRoom) {
			throw new Error(`Could not find room with external room id: ${externalRoomId}`);
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
			await this.internalRoomAdapter.createFederatedRoomForDirectMessage(newFederatedRoom);
			return;
		}

		await this.internalRoomAdapter.addUserToRoom(federatedRoom, federatedInviteeUser, federatedInviterUser);
	}

	public async onExternalMessageReceived(roomReceiveExternalMessageInput: FederationRoomReceiveExternalMessageDto): Promise<void> {
		const { externalRoomId, externalSenderId, messageText } = roomReceiveExternalMessageInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		const senderUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!senderUser) {
			return;
		}

		await this.internalMessageAdapter.sendMessage(senderUser, federatedRoom, messageText);
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
}
