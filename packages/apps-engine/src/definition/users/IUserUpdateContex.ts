import type { IUser } from './IUser';

/**
 * The context of execution for the
 * IPostUserUpdated event
 */
export interface IUserUpdateContext {
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

    /**
     * The user before the update
     */
    previousData?: IUser;
}
