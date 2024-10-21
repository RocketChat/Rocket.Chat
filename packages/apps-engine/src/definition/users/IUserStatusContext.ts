import type { IUser } from './IUser';

/**
 * The context of execution for the following events:
 * - IPostUserStatusChanged
 */
export interface IUserStatusContext {
    /**
     * The user that the status
     * was changed
     */
    user: IUser;
    /**
     * The new status set by the
     * user
     */
    currentStatus: string;
    /**
     * The status previous the
     * change
     */
    previousStatus: string;
}
