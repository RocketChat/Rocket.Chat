import type { IUser } from '../users';
import type { IMessageExtender } from './IMessageExtender';
import type { IRoomExtender } from './IRoomExtender';
import type { IVideoConferenceExtender } from './IVideoConferenceExtend';

/**
 * Adds to a record without overwriting what another App put there.
 *
 * An extender can only append — a second App extending the same message adds
 * to it rather than replacing the first App's work. Use `IModifyUpdater` when
 * a value really has to be replaced.
 */
export interface IModifyExtender {
	/**
	 * Modifies a message in a non-destructive way: Properties can be added to it,
	 * but existing properties cannot be changed.
	 *
	 * @param messageId the id of the message to be extended
	 * @param updater the user who is updating/extending the message
	 * @return the extender instance for the message
	 */
	extendMessage(messageId: string, updater: IUser): Promise<IMessageExtender>;

	/**
	 * Modifies a room in a non-destructive way: Properties can be added to it,
	 * but existing properties cannot be changed.
	 *
	 * @param roomId the id of the room to be extended
	 * @param updater the user who is updating/extending the room
	 * @return the extender instance for the room
	 */
	extendRoom(roomId: string, updater: IUser): Promise<IRoomExtender>;

	/**
	 * Modifies a video conference in a non-destructive way: Properties can be added to it,
	 * but existing properties cannot be changed.
	 */
	extendVideoConference(id: string): Promise<IVideoConferenceExtender>;

	/**
	 * Finishes the extending process, saving the object to the database.
	 *
	 * > [!WARNING]
	 * > This throws when the save fails, so nothing is written silently.
	 *
	 * @param extender the extender instance
	 */
	finish(extender: IRoomExtender | IMessageExtender | IVideoConferenceExtender): Promise<void>;
}
