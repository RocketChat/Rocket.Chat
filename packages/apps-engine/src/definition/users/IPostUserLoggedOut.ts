import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { IUser } from './IUser';

/**
 * Event interface that allows an app to
 * register as a handler of the `IPostUserLoggedOut`
 * event
 *
 * This event is triggered *after* the
 * user logout from the Rocket.chat
 */
export interface IPostUserLoggedOut {
    [AppMethod.EXECUTE_POST_USER_LOGGED_OUT](context: IUser, read: IRead, http: IHttp, persis: IPersistence, modify: IModify): Promise<void>;
}
