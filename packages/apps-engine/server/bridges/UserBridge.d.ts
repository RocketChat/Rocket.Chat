import { BaseBridge } from './BaseBridge';
import type { IUser, IUserCreationOptions, UserType } from '../../definition/users';
export declare abstract class UserBridge extends BaseBridge {
    doGetById(id: string, appId: string): Promise<IUser>;
    doGetByUsername(username: string, appId: string): Promise<IUser>;
    doGetAppUser(appId?: string): Promise<IUser | undefined>;
    doCreate(data: Partial<IUser>, appId: string, options?: IUserCreationOptions): Promise<string>;
    doRemove(user: IUser, appId: string): Promise<boolean>;
    doUpdate(user: IUser, updates: Partial<IUser>, appId: string): Promise<boolean>;
    doGetUserUnreadMessageCount(uid: string, appId: string): Promise<number>;
    doDeleteUsersCreatedByApp(appId: string, type: UserType.BOT | UserType.APP): Promise<boolean>;
    doDeactivate(userId: IUser['id'], confirmRelinquish: boolean, appId: string): Promise<boolean>;
    protected abstract getById(id: string, appId: string): Promise<IUser>;
    protected abstract getByUsername(username: string, appId: string): Promise<IUser>;
    protected abstract getAppUser(appId?: string): Promise<IUser | undefined>;
    protected abstract getActiveUserCount(): Promise<number>;
    protected abstract getUserUnreadMessageCount(uid: string, appId: string): Promise<number>;
    /**
     * Creates a user.
     * @param data the essential data for creating a user
     * @param appId the id of the app calling this
     * @param options options for passing extra data
     */
    protected abstract create(data: Partial<IUser>, appId: string, options?: IUserCreationOptions): Promise<string>;
    /**
     * Remove a user.
     *
     * @param user the user object to be removed
     * @param appId the id of the app executing the call
     */
    protected abstract remove(user: IUser, appId: string): Promise<boolean>;
    /**
     * Updates a user.
     *
     * Note: the actual methods used by apps to update
     * user properties are much more granular, but at a
     * bridge level we can adopt a more practical approach
     * since it is only accessible internally by the framework
     *
     * @param user the user to be updated
     * @param updates a map of properties to be updated
     * @param appId the id of the app executing the call
     */
    protected abstract update(user: IUser, updates: Partial<IUser>, appId: string): Promise<boolean>;
    /**
     * Deletes all bot or app users created by the App.
     * @param appId the App's ID.
     * @param type the type of the user to be deleted.
     * @returns true if any user was deleted, false otherwise.
     */
    protected abstract deleteUsersCreatedByApp(appId: string, type: UserType.APP | UserType.BOT): Promise<boolean>;
    /**
     * Deactivates a user.
     * @param userId the user's ID.
     * @param confirmRelinquish whether the user confirmed the relinquish of the account.
     * @param appId the App's ID.
     * @returns true if the user was deactivated, false otherwise.
     * @throws {Error} if the user is not found.
     * @throws {Error} if the user is the last admin.
     * @throws {Error} if the user is the last owner, if confirmRelinquish is false.
     */
    protected abstract deactivate(userId: IUser['id'], confirmRelinquish: boolean, appId: string): Promise<boolean>;
    private hasReadPermission;
    private hasWritePermission;
}
