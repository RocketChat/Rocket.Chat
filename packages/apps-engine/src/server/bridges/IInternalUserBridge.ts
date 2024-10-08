import type { IUser, IUserCreationOptions } from '../../definition/users';

export interface IInternalUserBridge {
    create(data: Partial<IUser>, appId: string, options?: IUserCreationOptions): Promise<string>;
    getAppUser(appId?: string): Promise<IUser | undefined>;
    remove(user: IUser, appId: string): Promise<boolean>;
    getActiveUserCount(): Promise<number>;
}
