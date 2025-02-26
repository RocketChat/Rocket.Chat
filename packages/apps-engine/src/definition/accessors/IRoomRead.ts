import type { GetMessagesOptions } from '../../server/bridges/RoomBridge';
import type { IMessageRaw } from '../messages/index';
import type { IRoom } from '../rooms/index';
import type { IUser } from '../users/index';

/**
 * This accessor provides methods for accessing
 * rooms in a read-only-fashion.
 */
export interface IRoomRead {
    /**
     * Gets a room by an id.
     *
     * @param id the id of the room
     * @returns the room
     */
    getById(id: string): Promise<IRoom | undefined>;

    /**
     * Gets just the creator of the room by the room's id.
     *
     * @param id the id of the room
     * @returns the creator of the room
     */
    getCreatorUserById(id: string): Promise<IUser | undefined>;

    /**
     * Gets a room by its name.
     *
     * @param name the name of the room
     * @returns the room
     */
    getByName(name: string): Promise<IRoom | undefined>;

    /**
     * Gets just the creator of the room by the room's name.
     *
     * @param name the name of the room
     * @returns the creator of the room
     */
    getCreatorUserByName(name: string): Promise<IUser | undefined>;

    /**
     * Retrieves an array of messages from the specified room.
     *
     * @param roomId The unique identifier of the room from which to retrieve messages.
     * @param options Optional parameters for retrieving messages:
     *                - limit: The maximum number of messages to retrieve. Maximum 100
     *                - skip: The number of messages to skip (for pagination).
     *                - sort: An object defining the sorting order of the messages. Each key is a field to sort by, and the value is either "asc" for ascending order or "desc" for descending order.
     *                - showThreadMessages: Whether to include thread messages in the results. Defaults to true.
     * @returns A Promise that resolves to an array of IMessage objects representing the messages in the room.
     */
    getMessages(roomId: string, options?: Partial<GetMessagesOptions>): Promise<Array<IMessageRaw>>;

    /**
     * Gets an iterator for all of the users in the provided room.
     *
     * @param roomId the room's id
     * @returns an iterator for the users in the room
     */
    getMembers(roomId: string): Promise<Array<IUser>>;

    /**
     * Gets a direct room with all usernames
     * @param usernames all usernames belonging to the direct room
     * @returns the room
     */
    getDirectByUsernames(usernames: Array<string>): Promise<IRoom>;

    /**
     * Get a list of the moderators of a given room
     *
     * @param roomId the room's id
     * @returns a list of the users with the moderator role in the room
     */
    getModerators(roomId: string): Promise<Array<IUser>>;

    /**
     * Get a list of the owners of a given room
     *
     * @param roomId the room's id
     * @returns a list of the users with the owner role in the room
     */
    getOwners(roomId: string): Promise<Array<IUser>>;

    /**
     * Get a list of the leaders of a given room
     *
     * @param roomId the room's id
     * @returns a list of the users with the leader role in the room
     */
    getLeaders(roomId: string): Promise<Array<IUser>>;

    /**
     * Retrieves an array of unread messages for a specific user in a specific room.
     *
     * @param roomId The unique identifier of the room from which to retrieve unread messages.
     * @param uid The unique identifier of the user for whom to retrieve unread messages.
     * @param options Optional parameters for retrieving messages:
     *                - limit: The maximum number of messages to retrieve. If more than 100 is passed, it defaults to 100.
     *                - skip: The number of messages to skip (for pagination).
     *                - sort: An object defining the sorting order of the messages. Each key is a field to sort by, and the value is either 'asc' for ascending order or 'desc' for descending order.
     *                - showThreadMessages: Whether to include thread messages in the results. Defaults to true.
     * @returns A Promise that resolves to an array of IMessage objects representing the unread messages for the specified user in the specified room.
     */
    getUnreadByUser(roomId: string, uid: string, options?: Partial<GetMessagesOptions>): Promise<IMessageRaw[]>;

    /**
     * Gets the user's unread messages count in a room.
     * @param roomId room's id
     * @param uid user's id
     */
    getUserUnreadMessageCount(roomId: string, uid: string): Promise<number>;
}
