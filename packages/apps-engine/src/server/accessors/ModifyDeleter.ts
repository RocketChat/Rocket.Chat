import type { IModifyDeleter } from '../../definition/accessors';
import type { IMessage } from '../../definition/messages';
import type { IUser, UserType } from '../../definition/users';
import type { AppBridges } from '../bridges';

export class ModifyDeleter implements IModifyDeleter {
    constructor(
        private readonly bridges: AppBridges,
        private readonly appId: string,
    ) {}

    public async deleteRoom(roomId: string): Promise<void> {
        return this.bridges.getRoomBridge().doDelete(roomId, this.appId);
    }

    public async deleteUsers(appId: Exclude<IUser['appId'], undefined>, userType: UserType.APP | UserType.BOT): Promise<boolean> {
        return this.bridges.getUserBridge().doDeleteUsersCreatedByApp(appId, userType);
    }

    public async deleteMessage(message: IMessage, user: IUser): Promise<void> {
        return this.bridges.getMessageBridge().doDelete(message, user, this.appId);
    }

    /**
     * Removes `usernames` from the room's member list
     *
     * For performance reasons, it is only possible to remove 50 users in one
     * call to this method. Removing users is an expensive operation due to the
     * amount of entity relationships that need to be modified.
     */
    public async removeUsersFromRoom(roomId: string, usernames: Array<string>) {
        if (usernames.length > 50) {
            throw new Error('A maximum of 50 members can be removed in a single call');
        }

        return this.bridges.getRoomBridge().doRemoveUsers(roomId, usernames, this.appId);
    }
}
