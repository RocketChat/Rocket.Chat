import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IRoomUserJoinedContext } from './IRoomUserJoinedContext';

/**
 * Event interface that allows an app to
 * register as a handler of the `IPostRoomUserJoined`
 * event
 *
 * This event is triggered after an user succcessfully joined
 * a room.
 *
 * This event does not allow an app to prevent any action from
 * happening. For that, see its "pre counterpart(s)":
 *
 * - IPreRoomUserJoined
 */
export interface IPostRoomUserJoined {
    executePostRoomUserJoined(context: IRoomUserJoinedContext, read: IRead, http: IHttp, persistence: IPersistence, modify?: IModify): Promise<void>;
}
