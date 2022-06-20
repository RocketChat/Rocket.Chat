import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IMessage, IUser } from '@rocket.chat/core-typings';

import { FederatedRoom } from '../domain/FederatedRoom';
import { FederatedUser } from '../domain/FederatedUser';
import { IFederationBridge } from '../domain/IFederationBridge';
import { RocketChatRoomAdapter } from '../infrastructure/rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';
import { FederationCreateDMAndInviteUserDto, FederationRoomSendExternalMessageDto } from './input/RoomSenderDto';
import { callbacks } from '../../../../lib/callbacks';

export class FederationRoomServiceSender {
	constructor(
		protected rocketRoomAdapter: RocketChatRoomAdapter,
		protected rocketUserAdapter: RocketChatUserAdapter,
		protected rocketSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		this.setupCallbacks();
	} // eslint-disable-line no-empty-function

	public async createDirectMessageRoomAndInviteUser(roomCreateDMAndInviteUserInput: FederationCreateDMAndInviteUserDto): Promise<void> {
		const { normalizedInviteeId, rawInviteeId, internalInviterId, inviteeUsernameOnly } = roomCreateDMAndInviteUserInput;

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
		const internalRoomId = FederatedRoom.buildRoomIdForDirectMessages(federatedInviterUser, federatedInviteeUser);

		if (!(await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId))) {
			const externalRoomId = await this.bridge.createDirectMessageRoom(federatedInviterUser.externalId, federatedInviteeUser.externalId);
			const newFederatedRoom = FederatedRoom.createInstance(
				externalRoomId,
				externalRoomId,
				federatedInviterUser,
				RoomType.DIRECT_MESSAGE,
				'',
				[federatedInviterUser, federatedInviteeUser] as any[],
			);
			await this.rocketRoomAdapter.createFederatedRoomForDirectMessage(newFederatedRoom);
		}

		const federatedRoom = (await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId)) as FederatedRoom;
		if (isInviteeFromTheSameHomeServer) {
			await this.bridge.createUser(
				inviteeUsernameOnly,
				federatedInviteeUser.internalReference.name as string,
				this.rocketSettingsAdapter.getHomeServerDomain(),
			);
			await this.bridge.inviteToRoom(federatedRoom.externalId, federatedInviterUser.externalId, federatedInviteeUser.externalId);
			await this.bridge.joinRoom(federatedRoom.externalId, federatedInviteeUser.externalId);
		}
		await this.rocketRoomAdapter.addUserToRoom(federatedRoom, federatedInviteeUser, federatedInviterUser);
	}

	public async leaveRoom(rocketUser: any, rocketRoom: any): Promise<void> {
		await this.bridge.leaveRoom(rocketRoom._id, rocketUser._id);
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

	private async setupCallbacks(): Promise<void> {
		callbacks.add('afterLeaveRoom', this.leaveRoom);
	}
}
