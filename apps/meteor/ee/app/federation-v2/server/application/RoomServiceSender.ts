import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom, IUser } from '@rocket.chat/core-typings';

import { FederationRoomServiceSender } from '../../../../../app/federation-v2/server/application/RoomServiceSender';
import { FederatedRoom } from '../../../../../app/federation-v2/server/domain/FederatedRoom';
import { FederatedUser } from '../../../../../app/federation-v2/server/domain/FederatedUser';
import { RocketChatSettingsAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/User';
import { IFederationBridgeEE } from '../domain/IFederationBridge';
import { RocketChatNotificationAdapter } from '../infrastructure/rocket-chat/adapters/Notification';
import { RocketChatRoomAdapterEE } from '../infrastructure/rocket-chat/adapters/Room';
import { FederationRoomInviteUserDto } from './input/RoomSenderDto';

export class FederationRoomServiceSenderEE extends FederationRoomServiceSender {
	constructor(
		protected rocketRoomAdapter: RocketChatRoomAdapterEE,
		protected rocketUserAdapter: RocketChatUserAdapter,
		protected rocketSettingsAdapter: RocketChatSettingsAdapter,
		protected rocketNotificationAdapter: RocketChatNotificationAdapter,
		protected bridge: IFederationBridgeEE,
	) {
		super(rocketRoomAdapter, rocketUserAdapter, rocketSettingsAdapter, bridge);
	} // eslint-disable-line no-empty-function

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
}
