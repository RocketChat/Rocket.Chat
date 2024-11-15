import type { IModifyDeleter } from '../../definition/accessors';
import type { IMessage } from '../../definition/messages';
import type { IUser, UserType } from '../../definition/users';
import type { AppBridges } from '../bridges';
export declare class ModifyDeleter implements IModifyDeleter {
    private readonly bridges;
    private readonly appId;
    constructor(bridges: AppBridges, appId: string);
    deleteRoom(roomId: string): Promise<void>;
    deleteUsers(appId: Exclude<IUser['appId'], undefined>, userType: UserType.APP | UserType.BOT): Promise<boolean>;
    deleteMessage(message: IMessage, user: IUser): Promise<void>;
    /**
     * Removes `usernames` from the room's member list
     *
     * For performance reasons, it is only possible to remove 50 users in one
     * call to this method. Removing users is an expensive operation due to the
     * amount of entity relationships that need to be modified.
     */
    removeUsersFromRoom(roomId: string, usernames: Array<string>): Promise<void>;
}
