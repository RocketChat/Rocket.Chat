import type { RocketChatAssociationModel } from '../metadata';
import type { IRoom } from '../rooms';
import type { IUser } from '../users';

export interface IRoomExtender {
    kind: RocketChatAssociationModel.ROOM;

    /**
     * Adds a custom field to the room.
     * Note: This key can not already exist or it will throw an error.
     * Note: The key must not contain a period in it, an error will be thrown.
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
     * Note: modifying the returned value will have no effect.
     */
    getRoom(): IRoom;
}
