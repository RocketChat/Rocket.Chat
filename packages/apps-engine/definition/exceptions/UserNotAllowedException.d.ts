import { AppsEngineException } from '.';
/**
 * This exception informs the host system that an
 * app has determined that an user is not allowed
 * to perform a specific action.
 *
 * Currently it is expected to be thrown by the
 * following events:
 * - IPreRoomCreatePrevent
 * - IPreRoomUserJoined
 * - IPreRoomUserLeave
 */
export declare class UserNotAllowedException extends AppsEngineException {
}
