import type { IUser } from '../users';
import type { IRoom } from './IRoom';

/**
 * The context of execution for the following events:
 * - IPreRoomUserLeave
 * - IPostRoomUserLeave
 */
export interface IRoomUserLeaveContext {
    /**
     * The user that is leaving the room
     */
    leavingUser: IUser;
    /**
     * The room that the user is leaving
     */
    room: IRoom;
}
