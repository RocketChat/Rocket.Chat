import type { IMessage } from '../messages';
import type { IRoom } from '../rooms';
import type { IUser } from '../users';
import type { IMessageBuilder } from './IMessageBuilder';

export enum TypingScope {
    Room = 'room',
}

export interface ITypingOptions {
    /**
     * The typing scope where the typing message should be presented,
     * TypingScope.Room by default.
     */
    scope?: TypingScope;
    /**
     * The id of the typing scope
     *
     * TypingScope.Room <-> room.id
     */
    id: string;
    /**
     * The name of the user who is typing the message
     *
     * **Note**: If not provided, it will use app assigned
     * user's name by default.
     */
    username?: string;
}

export interface INotifier {
    /**
     * Notifies the provided user of the provided message.
     *
     * **Note**: Notifications only are shown to the user if they are
     * online and it only stays around for the duration of their session.
     *
     * @param user The user who should be notified
     * @param message The message with the content to notify the user about
     */
    notifyUser(user: IUser, message: IMessage): Promise<void>;

    /**
     * Notifies all of the users in the provided room.
     *
     * **Note**: Notifications only are shown to those online
     * and it only stays around for the duration of their session.
     *
     * @param room The room which to notify the users in
     * @param message The message content to notify users about
     */
    notifyRoom(room: IRoom, message: IMessage): Promise<void>;

    /**
     * Notifies all of the users a typing indicator in the provided scope.
     *
     * @returns a cancellation function to stop typing
     */
    typing(options: ITypingOptions): Promise<() => Promise<void>>;

    /** Gets a new message builder for building a notification message. */
    getMessageBuilder(): IMessageBuilder;
}
