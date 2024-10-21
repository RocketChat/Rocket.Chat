import type { IUser } from '../users';
import type { ILivechatUpdater } from './ILivechatUpdater';
import type { IMessageBuilder } from './IMessageBuilder';
import type { IMessageUpdater } from './IMessageUpdater';
import type { IRoomBuilder } from './IRoomBuilder';
import type { IUserUpdater } from './IUserUpdater';

export interface IModifyUpdater {
    /**
     * Get the updater object responsible for the
     * Livechat integrations
     */
    getLivechatUpdater(): ILivechatUpdater;

    /**
     * Gets the update object responsible for
     * methods that update users
     */
    getUserUpdater(): IUserUpdater;

    /**
     * Get the updater object responsible for
     * methods that update messages
     */
    getMessageUpdater(): IMessageUpdater;

    /**
     * Modifies an existing message.
     * Raises an exception if a non-existent messageId is supplied
     *
     * @param messageId the id of the existing message to modfiy and build
     * @param updater the user who is updating the message
     */
    message(messageId: string, updater: IUser): Promise<IMessageBuilder>;

    /**
     * Modifies an existing room.
     * Raises an exception if a non-existent roomId is supplied
     *
     * @param roomId the id of the existing room to modify and build
     * @param updater the user who is updating the room
     */
    room(roomId: string, updater: IUser): Promise<IRoomBuilder>;

    /**
     * Finishes the updating process, saving the object to the database.
     * Note: If there is an issue or error while updating, this will throw an error.
     *
     * @param builder the builder instance
     */
    finish(builder: IMessageBuilder | IRoomBuilder): Promise<void>;
}
