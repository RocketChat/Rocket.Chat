import type { IUser } from '../users';
import type { IRoom } from './IRoom';

/**
 * The context of execution for the following events:
 * - IPreRoomUserJoined
 * - IPostRoomUserJoined
 */
export interface IRoomUserJoinedContext {
    /**
     * The user that is being added to the room
     */
    joiningUser: IUser;
    /**
     * The room to which the user is being added
     */
    room: IRoom;
    /**
     * The user that has invited `joiningUser` to `room`,
     * if any.
     */
    inviter?: IUser;
}
