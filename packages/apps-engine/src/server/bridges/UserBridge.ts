import { BaseBridge } from './BaseBridge';
import type { IUser, IUserCreationOptions, UserType } from '../../definition/users';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class UserBridge extends BaseBridge {
    public async doGetById(id: string, appId: string): Promise<IUser> {
        if (this.hasReadPermission(appId)) {
            return this.getById(id, appId);
        }
    }

    public async doGetByUsername(username: string, appId: string): Promise<IUser> {
        if (this.hasReadPermission(appId)) {
            return this.getByUsername(username, appId);
        }
    }

    public async doGetAppUser(appId?: string): Promise<IUser | undefined> {
        return this.getAppUser(appId);
    }

    public async doCreate(data: Partial<IUser>, appId: string, options?: IUserCreationOptions): Promise<string> {
        if (this.hasWritePermission(appId)) {
            return this.create(data, appId, options || {});
        }
    }

    public async doRemove(user: IUser, appId: string): Promise<boolean> {
        if (this.hasWritePermission(appId)) {
            return this.remove(user, appId);
        }
    }

    public async doUpdate(user: IUser, updates: Partial<IUser>, appId: string): Promise<boolean> {
        if (this.hasWritePermission(appId)) {
            return this.update(user, updates, appId);
        }
    }

    public async doGetUserUnreadMessageCount(uid: string, appId: string): Promise<number> {
        if (this.hasReadPermission(appId)) {
            return this.getUserUnreadMessageCount(uid, appId);
        }
    }

    public async doDeleteUsersCreatedByApp(appId: string, type: UserType.BOT | UserType.APP): Promise<boolean> {
        if (this.hasWritePermission(appId)) {
            return this.deleteUsersCreatedByApp(appId, type);
        }
    }

    public async doDeactivate(userId: IUser['id'], confirmRelinquish: boolean, appId: string): Promise<boolean> {
        if (this.hasWritePermission(appId)) {
            return this.deactivate(userId, confirmRelinquish, appId);
        }
    }

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

    private hasReadPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.user.read)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.user.read],
            }),
        );

        return false;
    }

    private hasWritePermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.user.write)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.user.write],
            }),
        );

        return false;
    }
}
