import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import { FederatedRoom } from '../domain/FederatedRoom';
import { FederatedUser } from '../domain/FederatedUser';
import type { IFederationBridge } from '../domain/IFederationBridge';
import type { RocketChatRoomAdapter } from '../infrastructure/rocket-chat/adapters/Room';
import type { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import type { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';
import type {
	FederationAfterLeaveRoomDto,
	FederationCreateDMAndInviteUserDto,
	FederationRoomSendExternalMessageDto,
} from './input/RoomSenderDto';

export class FederationRoomServiceSender {
	constructor(
		protected rocketRoomAdapter: RocketChatRoomAdapter,
		protected rocketUserAdapter: RocketChatUserAdapter,
		protected rocketSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {} // eslint-disable-line no-empty-function

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
		const isInviteeFromTheSameHomeServer = this.bridge.isUserIdFromTheSameHomeserver(
			rawInviteeId,
			this.rocketSettingsAdapter.getHomeServerDomain(),
		);
		const internalRoomId = FederatedRoom.buildRoomIdForDirectMessages(federatedInviterUser, federatedInviteeUser);

		if (!(await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId))) {
			const externalRoomId = await this.bridge.createDirectMessageRoom(federatedInviterUser.externalId, [federatedInviteeUser.externalId]);
			const newFederatedRoom = FederatedRoom.createInstance(
				externalRoomId,
				externalRoomId,
				federatedInviterUser,
				RoomType.DIRECT_MESSAGE,
				'',
				[federatedInviterUser, federatedInviteeUser] as any[],
			);
			await this.rocketRoomAdapter.createFederatedRoom(newFederatedRoom);
		}

		const federatedRoom = (await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId)) as FederatedRoom;
		if (isInviteeFromTheSameHomeServer) {
			await this.bridge.createUser(
				inviteeUsernameOnly,
				federatedInviteeUser?.internalReference?.name || normalizedInviteeId,
				this.rocketSettingsAdapter.getHomeServerDomain(),
			);
			await this.bridge.inviteToRoom(federatedRoom.externalId, federatedInviterUser.externalId, federatedInviteeUser.externalId);
			await this.bridge.joinRoom(federatedRoom.externalId, federatedInviteeUser.externalId);
		}
		await this.rocketRoomAdapter.addUserToRoom(federatedRoom, federatedInviteeUser, federatedInviterUser);
	}

	public async leaveRoom(afterLeaveRoomInput: FederationAfterLeaveRoomDto): Promise<void> {
		const { internalRoomId, internalUserId, whoRemovedInternalId } = afterLeaveRoomInput;

		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.rocketUserAdapter.getFederatedUserByInternalId(internalUserId);
		if (!federatedUser) {
			return;
		}

		if (whoRemovedInternalId) {
			const who = await this.rocketUserAdapter.getFederatedUserByInternalId(whoRemovedInternalId);
			await this.bridge.kickUserFromRoom(federatedRoom.externalId, federatedUser.externalId, who?.externalId as string);
			return;
		}

		await this.bridge.leaveRoom(federatedRoom.externalId, federatedUser.externalId);
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

	public async canAddThisUserToTheRoom(internalUser: IUser | string, internalRoom: IRoom): Promise<void> {
		const newUserBeingAdded = typeof internalUser === 'string';
		if (newUserBeingAdded) {
			return;
		}

		if (internalRoom.federated) {
			return;
		}

		const user = await this.rocketUserAdapter.getFederatedUserByInternalId((internalUser as IUser)._id);
		if (user && !user.existsOnlyOnProxyServer) {
			throw new Error('error-cant-add-federated-users');
		}
	}

	public async canAddUsersToTheRoom(internalUser: IUser | string, internalInviter: IUser, internalRoom: IRoom): Promise<void> {
		if (!internalRoom.federated) {
			return;
		}
		const tryingToAddNewFederatedUser = typeof internalUser === 'string';
		if (tryingToAddNewFederatedUser) {
			throw new Error('error-this-is-an-ee-feature');
		}

		const invitee = await this.rocketUserAdapter.getFederatedUserByInternalId((internalUser as IUser)._id);
		const inviter = await this.rocketUserAdapter.getFederatedUserByInternalId((internalInviter as IUser)._id);
		const externalRoom = await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoom._id);
		if (!externalRoom || !inviter) {
			return;
		}

		const isARoomFromTheProxyServer = this.bridge.isRoomFromTheSameHomeserver(
			externalRoom.externalId,
			this.rocketSettingsAdapter.getHomeServerDomain(),
		);
		const isInviterFromTheProxyServer = this.bridge.isUserIdFromTheSameHomeserver(
			inviter.externalId,
			this.rocketSettingsAdapter.getHomeServerDomain(),
		);

		if (!isARoomFromTheProxyServer && !isInviterFromTheProxyServer) {
			return;
		}
		if (invitee && !invitee.existsOnlyOnProxyServer && internalRoom.t !== RoomType.DIRECT_MESSAGE) {
			throw new Error('error-this-is-an-ee-feature');
		}
	}

	public async beforeCreateDirectMessageFromUI(internalUsers: (IUser | string)[]): Promise<void> {
		const usernames = internalUsers.map((user) => {
			if (typeof user === 'string') {
				return user;
			}
			return user.username;
		});
		const isThereAnyFederatedUser =
			usernames.some((username) => username?.includes(':')) ||
			internalUsers.filter((user) => typeof user !== 'string').some((user) => (user as IUser).federated);
		if (isThereAnyFederatedUser) {
			throw new Error('error-this-is-an-ee-feature');
		}
	}
}
