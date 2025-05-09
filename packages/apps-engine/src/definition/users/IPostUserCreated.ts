import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { IUserContext } from './IUserContext';

/**
 * Event interface that allows an app to
 * register as a handler of the `IPostUserCreated`
 * event
 *
 * This event is triggered *after* the
 * user has been saved to the database.
 */
export interface IPostUserCreated {
    [AppMethod.EXECUTE_POST_USER_CREATED](context: IUserContext, read: IRead, http: IHttp, persis: IPersistence, modify: IModify): Promise<void>;
}
