import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { IUser } from './IUser';

/**
 * Event interface that allows an app to
 * register as a handler of the `IPostUserLoggedIn`
 * event
 *
 * This event is triggered *after* the
 * user logged into Rocket.chat
 */
export interface IPostUserLoggedIn {
    [AppMethod.EXECUTE_POST_USER_LOGGED_IN](context: IUser, read: IRead, http: IHttp, persis: IPersistence, modify: IModify): Promise<void>;
}
