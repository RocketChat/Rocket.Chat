import type { IUser } from './IUser';

/**
 * The context of execution for the following events:
 * - IPostUserCreated
 * - IPostUserDeleted
 */
export interface IUserContext {
    /**
     * The user that was affected by
     * update
     */
    user: IUser;
    /**
     * The user that performed the
     * updates
     */
    performedBy?: IUser;
}
