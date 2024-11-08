import type { IUser } from '../users/index';

/**
 * This accessor provides methods for accessing
 * users in a read-only-fashion.
 */
export interface IUserRead {
    getById(id: string): Promise<IUser>;

    getByUsername(username: string): Promise<IUser>;

    /**
     * Gets the app user of this app.
     */
    getAppUser(appId?: string): Promise<IUser | undefined>;

    /**
     * Gets the user's badge count (unread messages count).
     * @param uid user's id
     */
    getUserUnreadMessageCount(uid: string): Promise<number | undefined>;
}
