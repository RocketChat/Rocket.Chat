import type { RocketChatAssociationModel } from '../metadata';
import type { IRoom } from '../rooms';
import type { IUser } from '../users';

/**
 * Adds members and custom fields to a room, leaving everything already on it
 * alone.
 *
 * Get one from `IModifyExtender.extendRoom` and hand it back to
 * `IModifyExtender.finish` to apply the additions.
 */
export interface IRoomExtender {
	kind: RocketChatAssociationModel.ROOM;

	/**
	 * Adds a custom field to the room.
	 *
	 * > [!WARNING]
	 * > The key has to be new, and it must not contain a period. Either one
	 * > throws an error.
	 *
	 * @param key the name of the custom field
	 * @param value the value of this custom field
	 */
	addCustomField(key: string, value: any): IRoomExtender;

	/**
	 * Adds a user to the room.
	 *
	 * @param user the user which is to be added to the room
	 */
	addMember(user: IUser): IRoomExtender;

	/**
	 * Get a list of users being added to the room.
	 */
	getMembersBeingAdded(): Array<IUser>;

	/**
	 * Get a list of usernames of users being added to the room.
	 */
	getUsernamesOfMembersBeingAdded(): Array<string>;

	/**
	 * Gets the resulting room that has been extended at the point of calling this.
	 *
	 * > [!NOTE]
	 * > Modifying the returned value will have no effect.
	 */
	getRoom(): IRoom;
}
