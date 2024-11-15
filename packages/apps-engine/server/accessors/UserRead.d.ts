import type { IUserRead } from '../../definition/accessors';
import type { IUser } from '../../definition/users';
import type { UserBridge } from '../bridges/UserBridge';
export declare class UserRead implements IUserRead {
    private userBridge;
    private appId;
    constructor(userBridge: UserBridge, appId: string);
    getById(id: string): Promise<IUser>;
    getByUsername(username: string): Promise<IUser>;
    getAppUser(appId?: string): Promise<IUser | undefined>;
    getUserUnreadMessageCount(uid: string): Promise<number>;
}
