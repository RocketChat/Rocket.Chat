import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { IUserContext } from './IUserContext';

/**
 * Event interface that allows an app to
 * register as a handler of the `IPostUserDeleted`
 * event
 *
 * This event is triggered *after* the
 * user has been removed from the database.
 */
export interface IPostUserDeleted {
    [AppMethod.EXECUTE_POST_USER_CREATED](context: IUserContext, read: IRead, http: IHttp, persis: IPersistence, modify: IModify): Promise<void>;
}
