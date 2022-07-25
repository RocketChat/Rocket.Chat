import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { FederatedRoom } from '../domain/FederatedRoom';
import { FederatedUser } from '../domain/FederatedUser';
import { EVENT_ORIGIN, IFederationBridge } from '../domain/IFederationBridge';
import { RocketChatMessageAdapter } from '../infrastructure/rocket-chat/adapters/Message';
import { RocketChatRoomAdapter } from '../infrastructure/rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';
import {
	FederationRoomCreateInputDto,
	FederationRoomChangeMembershipDto,
	FederationRoomSendInternalMessageDto,
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
} from './input/RoomReceiverDto';

export class FederationRoomServiceReceiver {
	constructor(
		protected rocketRoomAdapter: RocketChatRoomAdapter,
		protected rocketUserAdapter: RocketChatUserAdapter,
		protected rocketMessageAdapter: RocketChatMessageAdapter,
		protected rocketSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {} // eslint-disable-line no-empty-function

	public async createRoom(roomCreateInput: FederationRoomCreateInputDto): Promise<void> {
		const {
			externalRoomId,
			externalInviterId,
			normalizedInviterId,
			externalRoomName,
			normalizedRoomId,
			roomType,
			wasInternallyProgramaticallyCreated = false,
		} = roomCreateInput;

		if ((await this.rocketRoomAdapter.getFederatedRoomByExternalId(externalRoomId)) || wasInternallyProgramaticallyCreated) {
			return;
		}

		if (!(await this.rocketUserAdapter.getFederatedUserByExternalId(externalInviterId))) {
			const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalInviterId);
			const name = externalUserProfileInformation?.displayname || normalizedInviterId;
			const federatedCreatorUser = FederatedUser.createInstance(externalInviterId, {
				name,
				username: normalizedInviterId,
				existsOnlyOnProxyServer: false,
			});

			await this.rocketUserAdapter.createFederatedUser(federatedCreatorUser);
		}
		const creator = await this.rocketUserAdapter.getFederatedUserByExternalId(externalInviterId);
		const newFederatedRoom = FederatedRoom.createInstance(
			externalRoomId,
			normalizedRoomId,
			creator as FederatedUser,
			roomType || RoomType.CHANNEL,
			externalRoomName,
		);
		await this.rocketRoomAdapter.createFederatedRoom(newFederatedRoom);
	}

	public async changeRoomMembership(roomChangeMembershipInput: FederationRoomChangeMembershipDto): Promise<void> {
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
		const affectedFederatedRoom = await this.rocketRoomAdapter.getFederatedRoomByExternalId(externalRoomId);

		if (!affectedFederatedRoom && eventOrigin === EVENT_ORIGIN.LOCAL) {
			throw new Error(`Could not find room with external room id: ${externalRoomId}`);
		}
		const isInviterFromTheSameHomeServer = this.bridge.isUserIdFromTheSameHomeserver(
			externalInviterId,
			this.rocketSettingsAdapter.getHomeServerDomain(),
		);
		const isInviteeFromTheSameHomeServer = this.bridge.isUserIdFromTheSameHomeserver(
			externalInviteeId,
			this.rocketSettingsAdapter.getHomeServerDomain(),
		);

		if (!(await this.rocketUserAdapter.getFederatedUserByExternalId(externalInviterId))) {
			const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalInviterId);
			const name = externalUserProfileInformation?.displayname || normalizedInviterId;
			const username = isInviterFromTheSameHomeServer ? inviterUsernameOnly : normalizedInviterId;
			const federatedInviterUser = FederatedUser.createInstance(externalInviterId, {
				name,
				username,
				existsOnlyOnProxyServer: isInviterFromTheSameHomeServer,
			});

			await this.rocketUserAdapter.createFederatedUser(federatedInviterUser);
		}

		if (!(await this.rocketUserAdapter.getFederatedUserByExternalId(externalInviteeId))) {
			const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalInviteeId);
			const name = externalUserProfileInformation?.displayname || normalizedInviteeId;
			const username = isInviteeFromTheSameHomeServer ? inviteeUsernameOnly : normalizedInviteeId;
			const federatedInviteeUser = FederatedUser.createInstance(externalInviteeId, {
				name,
				username,
				existsOnlyOnProxyServer: isInviteeFromTheSameHomeServer,
			});

			await this.rocketUserAdapter.createFederatedUser(federatedInviteeUser);
		}

		const federatedInviteeUser = await this.rocketUserAdapter.getFederatedUserByExternalId(externalInviteeId);
		const federatedInviterUser = await this.rocketUserAdapter.getFederatedUserByExternalId(externalInviterId);
		if (!affectedFederatedRoom && eventOrigin === EVENT_ORIGIN.REMOTE) {
			const members = [federatedInviterUser, federatedInviteeUser] as FederatedUser[];
			const newFederatedRoom = FederatedRoom.createInstance(
				externalRoomId,
				normalizedRoomId,
				federatedInviterUser as FederatedUser,
				roomType,
				externalRoomName,
				members,
			);

			await this.rocketRoomAdapter.createFederatedRoom(newFederatedRoom);
			await this.bridge.joinRoom(externalRoomId, externalInviteeId);
		}
		const federatedRoom = affectedFederatedRoom || (await this.rocketRoomAdapter.getFederatedRoomByExternalId(externalRoomId));
		if (leave) {
			if (
				!(await this.rocketRoomAdapter.isUserAlreadyJoined(
					federatedRoom?.internalReference?._id as string,
					federatedInviteeUser?.internalReference._id as string,
				))
			) {
				return;
			}

			return this.rocketRoomAdapter.removeUserFromRoom(
				federatedRoom as FederatedRoom,
				federatedInviteeUser as FederatedUser,
				federatedInviterUser as FederatedUser,
			);
		}
		if (affectedFederatedRoom?.isDirectMessage() && eventOrigin === EVENT_ORIGIN.REMOTE) {
			const membersUsernames = [
				...(affectedFederatedRoom.internalReference?.usernames || []),
				federatedInviteeUser?.internalReference.username as string,
			];
			const newFederatedRoom = FederatedRoom.createInstance(
				externalRoomId,
				normalizedRoomId,
				federatedInviterUser as FederatedUser,
				RoomType.DIRECT_MESSAGE,
				externalRoomName,
			);
			if (affectedFederatedRoom.internalReference?.usernames?.includes(federatedInviteeUser?.internalReference.username || '')) {
				return;
			}
			await this.rocketRoomAdapter.removeDirectMessageRoom(affectedFederatedRoom);
			await this.rocketRoomAdapter.createFederatedRoomForDirectMessage(newFederatedRoom, membersUsernames);
			return;
		}

		await this.rocketRoomAdapter.addUserToRoom(
			federatedRoom as FederatedRoom,
			federatedInviteeUser as FederatedUser,
			federatedInviterUser as FederatedUser,
		);
	}

	public async receiveExternalMessage(roomSendInternalMessageInput: FederationRoomSendInternalMessageDto): Promise<void> {
		const { externalRoomId, externalSenderId, text } = roomSendInternalMessageInput;

		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		const senderUser = await this.rocketUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!senderUser) {
			return;
		}

		await this.rocketMessageAdapter.sendMessage(senderUser, text, federatedRoom);
	}

	public async changeJoinRules(roomJoinRulesChangeInput: FederationRoomChangeJoinRulesDto): Promise<void> {
		const { externalRoomId, roomType } = roomJoinRulesChangeInput;

		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		if (federatedRoom.isDirectMessage()) {
			return;
		}

		federatedRoom.setRoomType(roomType);
		await this.rocketRoomAdapter.updateRoomType(federatedRoom);
	}

	public async changeRoomName(roomChangeNameInput: FederationRoomChangeNameDto): Promise<void> {
		const { externalRoomId, normalizedRoomName, externalSenderId } = roomChangeNameInput;

		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		if (federatedRoom.isDirectMessage()) {
			return;
		}

		if (federatedRoom.internalReference?.name === normalizedRoomName) {
			return;
		}

		const federatedUser = await this.rocketUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!federatedUser) {
			return;
		}

		federatedRoom.changeRoomName(normalizedRoomName);

		await this.rocketRoomAdapter.updateRoomName(federatedRoom, federatedUser);
	}

	public async changeRoomTopic(roomChangeTopicInput: FederationRoomChangeTopicDto): Promise<void> {
		const { externalRoomId, roomTopic, externalSenderId } = roomChangeTopicInput;

		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		if (federatedRoom.internalReference?.topic === roomTopic) {
			return;
		}

		if (federatedRoom.isDirectMessage()) {
			return;
		}

		const federatedUser = await this.rocketUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!federatedUser) {
			return;
		}

		federatedRoom.changeRoomTopic(roomTopic);

		await this.rocketRoomAdapter.updateRoomTopic(federatedRoom, federatedUser);
	}
}
