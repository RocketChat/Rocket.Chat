import type { RocketChatAssociationModel } from '../metadata';
import type { IRoom, RoomType } from '../rooms';
import type { IUser } from '../users';

/**
 * Interface for building out a room.
 * Please note, a room creator, name, and type must be set otherwise you will NOT
 * be able to successfully save the room object.
 */
export interface IRoomBuilder {
    kind: RocketChatAssociationModel.ROOM | RocketChatAssociationModel.DISCUSSION;

    /**
     * Provides a convient way to set the data for the room.
     * Note: Providing an "id" field here will be ignored.
     *
     * @param room the room data to set
     */
    setData(room: Partial<IRoom>): IRoomBuilder;

    /**
     * Sets the display name of this room.
     *
     * @param name the display name of the room
     */
    setDisplayName(name: string): IRoomBuilder;

    /**
     * Gets the display name of this room.
     */
    getDisplayName(): string;

    /**
     * Sets the slugified name of this room, it must align to the rules of Rocket.Chat room
     * names otherwise there will be an error thrown (no spaces, special characters, etc).
     *
     * @param name the slugified name
     */
    setSlugifiedName(name: string): IRoomBuilder;

    /**
     * Gets the slugified name of this room.
     */
    getSlugifiedName(): string;

    /**
     * Sets the room's type.
     *
     * @param type the room type
     */
    setType(type: RoomType): IRoomBuilder;

    /**
     * Gets the room's type.
     */
    getType(): RoomType;

    /**
     * Sets the creator of the room.
     *
     * @param creator the user who created the room
     */
    setCreator(creator: IUser): IRoomBuilder;

    /**
     * Gets the room's creator.
     */
    getCreator(): IUser;

    /**
     * Adds a user to the room, these are by username until further notice.
     *
     * @param username the user's username to add to the room
     * @deprecated in favor of `addMemberToBeAddedByUsername`. This method will be removed on version 2.0.0
     */
    addUsername(username: string): IRoomBuilder;

    /**
     * Sets the usernames of who are joined to the room.
     *
     * @param usernames the list of usernames
     * @deprecated in favor of `setMembersByUsernames`. This method will be removed on version 2.0.0
     */
    setUsernames(usernames: Array<string>): IRoomBuilder;

    /**
     * Gets the usernames of users in the room.
     * @deprecated in favor of `getMembersUsernames`. This method will be removed on version 2.0.0
     */
    getUsernames(): Array<string>;

    /**
     * Adds a member to the room by username
     *
     * @param username the user's username to add to the room
     */
    addMemberToBeAddedByUsername(username: string): IRoomBuilder;

    /**
     * Sets a list of members to the room by usernames
     *
     * @param usernames the list of usernames
     */
    setMembersToBeAddedByUsernames(usernames: Array<string>): IRoomBuilder;

    /**
     * Gets the list of usernames of the members who are been added to the room
     */
    getMembersToBeAddedUsernames(): Array<string>;

    /**
     * Sets whether this room should be a default room or not.
     * This means that new users will automatically join this room
     * when they join the server.
     *
     * @param isDefault room should be default or not
     */
    setDefault(isDefault: boolean): IRoomBuilder;

    /**
     * Gets whether this room is a default room or not.
     */
    getIsDefault(): boolean;

    /**
     * Sets whether this room should be in read only state or not.
     * This means that users without the required permission to talk when
     * a room is muted will not be able to talk but instead will only be
     * able to read the contents of the room.
     *
     * @param isReadOnly whether it should be read only or not
     */
    setReadOnly(isReadOnly: boolean): IRoomBuilder;

    /**
     * Gets whether this room is on read only state or not.
     */
    getIsReadOnly(): boolean;

    /**
     * Sets whether this room should display the system messages (like user join, etc)
     * or not. This means that whenever a system event, such as joining or leaving, happens
     * then Rocket.Chat won't send the message to the channel.
     *
     * @param displaySystemMessages whether the messages should display or not
     */
    setDisplayingOfSystemMessages(displaySystemMessages: boolean): IRoomBuilder;

    /**
     * Gets whether this room should display the system messages or not.
     */
    getDisplayingOfSystemMessages(): boolean;

    /**
     * Adds a custom field to the room.
     * Note: This will replace an existing field with the same key should it exist already.
     *
     * @param key the name of the key
     * @param value the value of the custom field
     */
    addCustomField(key: string, value: object): IRoomBuilder;

    /**
     * Sets the entire custom field property to an object provided. This will overwrite
     * every existing key/values which are unrecoverable.
     *
     * @param fields the data to set
     */
    setCustomFields(fields: { [key: string]: object }): IRoomBuilder;

    /**
     * Gets the custom field property of the room.
     */
    getCustomFields(): { [key: string]: object };

    /**
     * Gets user ids of members from a direct message
     */
    getUserIds(): Array<string>;

    /**
     * Gets the resulting room that has been built up to the point of calling this method.
     * Note: modifying the returned value will have no effect.
     */
    getRoom(): IRoom;
}
