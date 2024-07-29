import type { IUserRead } from '../../definition/accessors';
import type { IUser } from '../../definition/users';
import type { UserBridge } from '../bridges/UserBridge';

export class UserRead implements IUserRead {
    constructor(private userBridge: UserBridge, private appId: string) {}

    public getById(id: string): Promise<IUser> {
        return this.userBridge.doGetById(id, this.appId);
    }

    public getByUsername(username: string): Promise<IUser> {
        return this.userBridge.doGetByUsername(username, this.appId);
    }

    public getAppUser(appId: string = this.appId): Promise<IUser | undefined> {
        return this.userBridge.doGetAppUser(appId);
    }

    public getUserUnreadMessageCount(uid: string): Promise<number> {
        return this.userBridge.doGetUserUnreadMessageCount(uid, this.appId);
    }
}
