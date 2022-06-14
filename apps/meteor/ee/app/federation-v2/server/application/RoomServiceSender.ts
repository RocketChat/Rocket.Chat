import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom, IUser } from '@rocket.chat/core-typings';

import { FederationRoomServiceSender } from '../../../../../app/federation-v2/server/application/RoomServiceSender';
import { FederatedUser } from '../../../../../app/federation-v2/server/domain/FederatedUser';
import { RocketChatSettingsAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/User';
import { FederatedRoomEE } from '../domain/FederatedRoom';
import { IFederationBridgeEE } from '../domain/IFederationBridge';
import { RocketChatNotificationAdapter } from '../infrastructure/rocket-chat/adapters/Notification';
import { RocketChatRoomAdapterEE } from '../infrastructure/rocket-chat/adapters/Room';
import { FederationOnRoomCreationDto, FederationRoomInviteUserDto, FederationSetupRoomDto } from './input/RoomSenderDto';

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

	public async handleOnRoomCreation(roomOnCreationInput: FederationOnRoomCreationDto): Promise<void> {
		const { internalInviterId, internalRoomId, invitees } = roomOnCreationInput;
		await this.setupFederatedRoom({ internalInviterId, internalRoomId });
		await Promise.all(invitees.map((member) => this.inviteUserToAFederatedRoom({
			internalInviterId,
			internalRoomId,
			inviteeUsernameOnly: member.inviteeUsernameOnly,
			normalizedInviteeId: member.normalizedInviteeId,
			rawInviteeId: member.rawInviteeId,
		})))
	}

	public async setupFederatedRoom(roomInviteUserInput: FederationSetupRoomDto): Promise<void> {
		const { internalInviterId, internalRoomId } = roomInviteUserInput;

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

		const federatedInviterUser = (await this.rocketUserAdapter.getFederatedUserByInternalId(internalInviterId)) as FederatedUser;

		if (!(await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId))) {
			const internalRoom = (await this.rocketRoomAdapter.getInternalRoomById(internalRoomId)) as IRoom;
			const roomName = (internalRoom.fname || internalRoom.name) as string;
			const externalRoomId = await this.bridge.createRoom(
				federatedInviterUser.externalId,
				internalRoom.t as RoomType,
				roomName,
				internalRoom.topic,
			);
			const newFederatedRoom = FederatedRoomEE.createInstanceEE(
				externalRoomId,
				externalRoomId,
				federatedInviterUser,
				internalRoom.t as RoomType,
				roomName,
			);
			await this.rocketRoomAdapter.updateFederatedRoomByInternalRoomId(internalRoom._id, newFederatedRoom);
		}
	}

	public async inviteUserToAFederatedRoom(roomInviteUserInput: FederationRoomInviteUserDto): Promise<void> {
		const { internalInviterId, internalRoomId, normalizedInviteeId, inviteeUsernameOnly, rawInviteeId } = roomInviteUserInput;
		const isInviteeFromTheSameHomeServer = await this.bridge.isUserIdFromTheSameHomeserver(
			rawInviteeId,
			this.rocketSettingsAdapter.getHomeServerDomain(),
		);
		const federatedRoom = (await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId)) as FederatedRoomEE;
		const federatedInviterUser = (await this.rocketUserAdapter.getFederatedUserByInternalId(internalInviterId)) as FederatedUser;
		if (!federatedRoom) {
			throw new Error(`Could not find the room to invite. RoomId: ${internalRoomId}`);
		}

		if (isInviteeFromTheSameHomeServer) {
			const existsOnlyOnProxyServer = true;

			await this.createFederatedUserIfNecessary(inviteeUsernameOnly, rawInviteeId, existsOnlyOnProxyServer);
			
			const federatedInviteeUser = (await this.rocketUserAdapter.getFederatedUserByInternalUsername(inviteeUsernameOnly)) as FederatedUser;
			
			await this.bridge.createUser(
				inviteeUsernameOnly,
				federatedInviteeUser?.internalReference.name as string,
				this.rocketSettingsAdapter.getHomeServerDomain(),
			);
			await this.bridge.inviteToRoom(federatedRoom.externalId, federatedInviterUser.externalId, federatedInviteeUser.externalId);
			await this.bridge.joinRoom(federatedRoom.externalId, federatedInviteeUser.externalId);
			await this.rocketRoomAdapter.addUserToRoom(federatedRoom, federatedInviteeUser, federatedInviterUser);
			return;
		}
		
		const existsOnlyOnProxyServer = false;

		await this.createFederatedUserIfNecessary(normalizedInviteeId, rawInviteeId, existsOnlyOnProxyServer);
		
		const federatedInviteeUser = (await this.rocketUserAdapter.getFederatedUserByInternalUsername(normalizedInviteeId)) as FederatedUser;
		
		this.bridge.inviteToRoom(federatedRoom.externalId, federatedInviterUser.externalId, federatedInviteeUser?.externalId as string).catch(() => {
			this.rocketNotificationAdapter.notifyWithEphemeralMessage(
				'Federation_Matrix_only_owners_can_invite_users',
				federatedInviterUser?.internalReference?._id,
				internalRoomId,
				federatedInviterUser?.internalReference?.language,
			);
		});
		await this.rocketRoomAdapter.addUserToRoom(federatedRoom, federatedInviteeUser, federatedInviterUser);
	}

	private async createFederatedUserIfNecessary(username: string, rawUsername: string, existsOnlyOnProxyServer = false): Promise<void> {
		if (!(await this.rocketUserAdapter.getFederatedUserByInternalUsername(username))) {
			const externalUserProfileInformation = await this.bridge.getUserProfileInformation(rawUsername);
			const name = externalUserProfileInformation?.displayname || username;
			const newFederatedInviteeUser = FederatedUser.createInstance(rawUsername, {
				name,
				username: username,
				existsOnlyOnProxyServer,
			});

			await this.rocketUserAdapter.createFederatedUser(newFederatedInviteeUser);
		}
	}
}
