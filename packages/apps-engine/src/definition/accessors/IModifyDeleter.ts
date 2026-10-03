import type { IMessage } from '../messages';
import type { IUser, UserType } from '../users';

/**
 * Removes records.
 *
 * None of this can be undone, and a delete takes what hangs off the record
 * with it: a room's messages go with the room.
 */
export interface IModifyDeleter {
	deleteRoom(roomId: string): Promise<void>;

	deleteUsers(appId: Exclude<IUser['appId'], undefined>, userType: UserType.APP | UserType.BOT): Promise<boolean>;

	deleteMessage(message: IMessage, user: IUser): Promise<void>;

	removeUsersFromRoom(roomId: string, usernames: Array<string>): Promise<void>;
}
