import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IRoomUserLeaveContext } from './IRoomUserLeaveContext';

/**
 * Event interface that allows an app to
 * register as a handler of the `IPostRoomUserLeave`
 * event
 *
 * This event is triggered after an user succcessfully leaves
 * a room.
 *
 * This event does not allow an app to prevent any action from
 * happening. For that, see its "pre counterpart(s)":
 *
 * - IPreRoomUserLeave
 */
export interface IPostRoomUserLeave {
    executePostRoomUserLeave(context: IRoomUserLeaveContext, read: IRead, http: IHttp, persistence: IPersistence, modify?: IModify): Promise<void>;
}
