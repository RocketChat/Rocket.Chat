import type { IHttp, IPersistence, IRead } from '../accessors';
import type { IRoomUserJoinedContext } from './IRoomUserJoinedContext';

/**
 * Event interface that allows an app to
 * register as a handler of the `IPreRoomUserJoined`
 * event
 *
 * This event is triggered prior to an user succcessfully
 * joining a room. To prevent the user from executing
 * such action, an app should throw the `UserNotAllowedException`.
 *
 * This event is not triggered before a room has been created. For that,
 * check the `IPreRoomCreate` events
 */
export interface IPreRoomUserJoined {
    executePreRoomUserJoined(context: IRoomUserJoinedContext, read: IRead, http: IHttp, persistence: IPersistence): Promise<void>;
}
