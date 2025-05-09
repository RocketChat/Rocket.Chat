import type { IUser } from './IUser';

/**
 * The context of execution for the
 * IPostUserUpdated event
 */
export interface IUserUpdateContext {
    /**
     * The user who has been affected
     * by the action
     */
    user: IUser;

    /**
     * The user who performed the
     * update. Null if it's the user himself
     */
    performedBy?: IUser;

    /**
     * The user data before the update
     */
    previousData?: IUser;
}
