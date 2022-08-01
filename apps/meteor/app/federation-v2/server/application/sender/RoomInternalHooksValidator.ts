import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom, isRoomFederated, isUserFederated, IUser } from '@rocket.chat/core-typings';

import { IFederationBridge } from '../../domain/IFederationBridge';
import { RocketChatRoomAdapter } from '../../infrastructure/rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from '../../infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../../infrastructure/rocket-chat/adapters/User';
import { FederationService } from '../AbstractFederationService';

export class FederationRoomInternalHooksValidator extends FederationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalSettingsAdapter);
	}

	public async canAddFederatedUserToNonFederatedRoom(internalUser: IUser | string, internalRoom: IRoom): Promise<void> {
		if (this.isAddingANewExternalUser(internalUser)) {
			return;
		}

		if (isRoomFederated(internalRoom)) {
			return;
		}

		const user = await this.internalUserAdapter.getFederatedUserByInternalId((internalUser as IUser)._id);
		const isAFederatedUser = user && !user.isRemote();
		if (isAFederatedUser) {
			throw new Error('error-cant-add-federated-users');
		}
	}

	public async canAddFederatedUserToFederatedRoom(
		internalUser: IUser | string,
		internalInviter: IUser,
		internalRoom: IRoom,
	): Promise<void> {
		if (!isRoomFederated(internalRoom)) {
			return;
		}
		if (this.isAddingANewExternalUser(internalUser)) {
			throw new Error('error-this-is-an-ee-feature');
		}

		const inviter = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviter._id);
		const externalRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoom._id);
		if (!externalRoom || !inviter) {
			return;
		}

		const isRoomFromTheProxyServer = this.isAnInternalIdentifier(externalRoom.externalId);
		const isInviterFromTheProxyServer = this.isAnInternalIdentifier(inviter.getExternalId());

		const fullActionExecutedOnTheRemoteHomeServer = !isRoomFromTheProxyServer && !isInviterFromTheProxyServer;
		if (fullActionExecutedOnTheRemoteHomeServer) {
			return;
		}

		const invitee = await this.internalUserAdapter.getFederatedUserByInternalId((internalUser as IUser)._id);
		const addingAnExternalUser = invitee && !invitee.isRemote();
		const addingExternalUserToNonDirectMessageRoom = addingAnExternalUser && internalRoom.t !== RoomType.DIRECT_MESSAGE;
		if (addingExternalUserToNonDirectMessageRoom) {
			throw new Error('error-this-is-an-ee-feature');
		}
	}

	public async canCreateDirectMessageFromUI(internalUsers: (IUser | string)[]): Promise<void> {
		const usernames = internalUsers.map((user) => {
			if (this.isAddingANewExternalUser(user)) {
				return user;
			}
			return (user as IUser).username;
		});
		const atLeastOneExternalUser =
			usernames.some((username) => this.isAnInternalIdentifier((username as string) || '')) ||
			internalUsers.filter((user) => this.isAddingANewExternalUser(user)).some((user) => isUserFederated(user as IUser));
		if (atLeastOneExternalUser) {
			throw new Error('error-this-is-an-ee-feature');
		}
	}

	private isAddingANewExternalUser(user: IUser | string): boolean {
		return typeof user === 'string';
	}
}
