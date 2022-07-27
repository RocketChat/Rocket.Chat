import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IRoom, isRoomFederated, isUserFederated, IUser } from '@rocket.chat/core-typings';

import { IFederationBridge } from '../domain/IFederationBridge';
import { RocketChatRoomAdapter } from '../infrastructure/rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';
import { FederationService } from './AbstractFederationService';

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
        const addingNewExternalUser = typeof internalUser === 'string';
        if (addingNewExternalUser) {
            return;
        }

        if (isRoomFederated(internalRoom)) {
            return;
        }

        const user = await this.internalUserAdapter.getFederatedUserByInternalId(internalUser._id);
        const doNotAddFederatedUsersOnNonFederatedRooms = user && !user.existsOnlyOnProxyServer;
        if (doNotAddFederatedUsersOnNonFederatedRooms) {
            throw new Error('error-cant-add-federated-users');
        }
    }

    public async canAddFederatedUserToFederatedRoom(internalUser: IUser | string, internalInviter: IUser, internalRoom: IRoom): Promise<void> {
        if (!isRoomFederated(internalRoom)) {
            return;
        }
        const addingNewExternalUser = typeof internalUser === 'string';
        if (addingNewExternalUser) {
            throw new Error('error-this-is-an-ee-feature');
        }

        const inviter = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviter._id);
        const externalRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoom._id);
        if (!externalRoom || !inviter) {
            return;
        }

        const isRoomFromTheProxyServer = this.isAnInternalIdentifier(externalRoom.externalId);
        const isInviterFromTheProxyServer = this.isAnInternalIdentifier(inviter.externalId);

        const fullActionExecutedOnTheRemoteHomeServer = !isRoomFromTheProxyServer && !isInviterFromTheProxyServer;
        if (fullActionExecutedOnTheRemoteHomeServer) {
            return;
        }

        const invitee = await this.internalUserAdapter.getFederatedUserByInternalId(internalUser._id);
        const addingAnExternalUser = invitee && !invitee.existsOnlyOnProxyServer;
        const addingExternalUserToNonDirectMessageRoom = addingAnExternalUser && internalRoom.t !== RoomType.DIRECT_MESSAGE;
        if (addingExternalUserToNonDirectMessageRoom) {
            throw new Error('error-this-is-an-ee-feature');
        }
    }

    public async canCreateDirectMessageFromUI(internalUsers: (IUser | string)[]): Promise<void> {
        const usernames = internalUsers.map((user) => {
            if (typeof user === 'string') {
                return user;
            }
            return user.username;
        });
        const atLeastOneExternalUser =
            usernames.some((username) => this.isAnInternalIdentifier(username || '')) || //TODO: maybe filter this out before to come here
            internalUsers.filter((user) => typeof user !== 'string').some((user) => isUserFederated(user as IUser));
        if (atLeastOneExternalUser) {
            throw new Error('error-this-is-an-ee-feature');
        }
    }
}
