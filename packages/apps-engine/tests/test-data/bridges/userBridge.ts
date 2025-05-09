import type { IUser, UserType } from '../../../src/definition/users';
import { UserBridge } from '../../../src/server/bridges';

export class TestsUserBridge extends UserBridge {
    public getById(id: string, appId: string): Promise<IUser> {
        throw new Error('Method not implemented.');
    }

    public getByUsername(username: string, appId: string): Promise<IUser> {
        throw new Error('Method not implemented.');
    }

    public create(user: Partial<IUser>): Promise<string> {
        throw new Error('Method not implemented');
    }

    public getActiveUserCount(): Promise<number> {
        throw new Error('Method not implemented.');
    }

    public remove(user: IUser, appId: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }

    public getAppUser(appId?: string): Promise<IUser> {
        throw new Error('Method not implemented.');
    }

    public async update(user: IUser, updates: Partial<IUser>, appId: string): Promise<boolean> {
        throw new Error('Method not implemented');
    }

    public async deleteUsersCreatedByApp(appId: string, type: UserType.BOT): Promise<boolean> {
        throw new Error('Method not implemented');
    }

    protected getUserUnreadMessageCount(uid: string, appId: string): Promise<number> {
        throw new Error('Method not implemented.');
    }

    protected deactivate(userId: IUser['id'], confirmRelinquish: boolean, appId: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
}
