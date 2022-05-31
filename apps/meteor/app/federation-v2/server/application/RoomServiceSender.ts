import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import { FederatedRoom } from '../domain/FederatedRoom';
import { FederatedUser } from '../domain/FederatedUser';
import { IFederationBridge } from '../domain/IFederationBridge';
import { RocketChatNotificationAdapter } from '../infrastructure/rocket-chat/adapters/Notification';
import { RocketChatRoomAdapter } from '../infrastructure/rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';
import { FederationRoomInviteUserDto, FederationRoomSendExternalMessageDto } from './input/RoomSenderDto';

export class FederationRoomServiceSender {
	constructor(
		private rocketRoomAdapter: RocketChatRoomAdapter,
		private rocketUserAdapter: RocketChatUserAdapter,
		private rocketSettingsAdapter: RocketChatSettingsAdapter,
		private rocketNotificationAdapter: RocketChatNotificationAdapter,
		private bridge: IFederationBridge,
	) {} // eslint-disable-line no-empty-function

	public async inviteUserToAFederatedRoom(roomInviteUserInput: FederationRoomInviteUserDto): Promise<void> {
		const { normalizedInviteeId, rawInviteeId, internalInviterId, inviteeUsernameOnly, internalRoomId } = roomInviteUserInput;

		if (!(await this.rocketUserAdapter.getFederatedUserByInternalId(internalInviterId))) {
			const internalUser = (await this.rocketUserAdapter.getInternalUserById(internalInviterId)) as IUser;
			const externalInviterId = await this.bridge.createUser(
				internalUser.username as string,
				internalUser.name as string,
				this.rocketSettingsAdapter.getHomeServerDomain(),
			);
			const federatedInviterUser = FederatedUser.createInstance(externalInviterId, {
				name: internalUser.name as string,
				username: internalUser.username as string,
				existsOnlyOnProxyServer: true,
			});
			await this.rocketUserAdapter.createFederatedUser(federatedInviterUser);
		}

		if (!(await this.rocketUserAdapter.getFederatedUserByInternalUsername(normalizedInviteeId))) {
			const externalUserProfileInformation = await this.bridge.getUserProfileInformation(rawInviteeId);
			const name = externalUserProfileInformation?.displayname || normalizedInviteeId;
			const federatedInviteeUser = FederatedUser.createInstance(rawInviteeId, {
				name,
				username: normalizedInviteeId,
				existsOnlyOnProxyServer: false,
			});

			await this.rocketUserAdapter.createFederatedUser(federatedInviteeUser);
		}

		const federatedInviterUser = (await this.rocketUserAdapter.getFederatedUserByInternalId(internalInviterId)) as FederatedUser;
		const federatedInviteeUser = (await this.rocketUserAdapter.getFederatedUserByInternalUsername(normalizedInviteeId)) as FederatedUser;
		const isInviteeFromTheSameHomeServer = await this.bridge.isUserIdFromTheSameHomeserver(
			rawInviteeId,
			this.rocketSettingsAdapter.getHomeServerDomain(),
		);

		if (!(await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId))) {
			const internalRoom = (await this.rocketRoomAdapter.getInternalRoomById(internalRoomId)) as IRoom;
			const roomName = (internalRoom.fname || internalRoom.name) as string;
			const externalRoomId = await this.bridge.createRoom(
				federatedInviterUser.externalId,
				federatedInviteeUser.externalId,
				internalRoom.t as RoomType,
				roomName,
				internalRoom.topic,
			);
			const newFederatedRoom = FederatedRoom.createInstance(
				externalRoomId,
				externalRoomId,
				federatedInviterUser,
				internalRoom.t as RoomType,
				roomName,
			);
			await this.rocketRoomAdapter.updateFederatedRoomByInternalRoomId(internalRoom._id, newFederatedRoom);
		}

		const federatedRoom = (await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId)) as FederatedRoom;
		const wasInvitedWhenTheRoomWasCreated = federatedRoom.isDirectMessage();
		if (isInviteeFromTheSameHomeServer) {
			await this.bridge.createUser(
				inviteeUsernameOnly,
				federatedInviteeUser.internalReference.name as string,
				this.rocketSettingsAdapter.getHomeServerDomain(),
			);
			await this.bridge.inviteToRoom(federatedRoom.externalId, federatedInviterUser.externalId, federatedInviteeUser.externalId);
			await this.bridge.joinRoom(federatedRoom.externalId, federatedInviteeUser.externalId);
		} else if (!wasInvitedWhenTheRoomWasCreated) {
			this.bridge.inviteToRoom(federatedRoom.externalId, federatedInviterUser.externalId, federatedInviteeUser.externalId).catch(() => {
				this.rocketNotificationAdapter.notifyWithEphemeralMessage(
					'Federation_Matrix_only_owners_can_invite_users',
					federatedInviterUser?.internalReference?._id,
					internalRoomId,
					federatedInviterUser?.internalReference?.language,
				);
			});
		}
		await this.rocketRoomAdapter.addUserToRoom(federatedRoom, federatedInviteeUser, federatedInviterUser);
	}

	public async sendMessageFromRocketChat(roomSendExternalMessageInput: FederationRoomSendExternalMessageDto): Promise<IMessage> {
		const { internalRoomId, internalSenderId, message } = roomSendExternalMessageInput;

		const federatedSender = await this.rocketUserAdapter.getFederatedUserByInternalId(internalSenderId);
		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId);

		if (!federatedSender) {
			throw new Error(`Could not find user id for ${internalSenderId}`);
		}
		if (!federatedRoom) {
			throw new Error(`Could not find room id for ${internalRoomId}`);
		}

		await this.bridge.sendMessage(federatedRoom.externalId, federatedSender.externalId, message.msg);

		return message;
	}

	public async isAFederatedRoom(internalRoomId: string): Promise<boolean> {
		if (!internalRoomId) {
			return false;
		}
		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId);

		return Boolean(federatedRoom?.isFederated());
	}
}
