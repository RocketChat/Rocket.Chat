import type { IMessage } from '../messages/index';
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
     * Gets an iterator for all of the messages in the provided room.
     *
     * @param roomId the room's id
     * @returns an iterator for messages
     */
    getMessages(roomId: string): Promise<IterableIterator<IMessage>>;

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
}
