import type { IMessage } from '../messages';
import type { IRoom } from '../rooms';
import type { IUser } from '../users';
import type { IMessageBuilder } from './IMessageBuilder';

/** Where a typing indicator is shown. */
export enum TypingScope {
	/** In a room, to everyone looking at it. */
	Room = 'room',
}

/** Who to show a typing indicator to, and on whose behalf. */
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
	 * > [!NOTE]
	 * > The App's own user is used when this is not provided.
	 */
	username?: string;
}

/**
 * Sends messages that are shown but never stored.
 *
 * Nothing here is written to a room: the message reaches whoever is connected
 * at the time, and is gone when they reload. Use `IModifyCreator` for a
 * message that has to stay.
 */
export interface INotifier {
	/**
	 * Notifies the provided user of the provided message.
	 *
	 * > [!NOTE]
	 * > The user sees this only if they are online, and only until their
	 * > session ends. Nothing is stored.
	 *
	 * @param user The user who should be notified
	 * @param message The message with the content to notify the user about
	 */
	notifyUser(user: IUser, message: IMessage): Promise<void>;

	/**
	 * Notifies all of the users in the provided room.
	 *
	 * > [!NOTE]
	 * > Only the users who are online see this, and only until their session
	 * > ends. Nothing is stored.
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
