import type { IMessage } from '.';
import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IMessageDeleteContext } from './IMessageDeleteContext';

/** Handler for after a message is deleted. */
export interface IPostMessageDeleted {
    /**
     * Enables the handler to signal to the Apps framework whether
     * this handler should actually be executed for after the message
     * has been deleted.
     *
     * @param message The deleted message
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param context The context of the message which was deleted
     * @returns whether to run the executor function
     */
    checkPostMessageDeleted?(message: IMessage, read: IRead, http: IHttp, context: IMessageDeleteContext): Promise<boolean>;

    /**
     * Method called *after* the message has been deleted.
     *
     * @param message The deleted message
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence
     * @param context The context of the message which was deleted
     */
    executePostMessageDeleted(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
        context: IMessageDeleteContext,
    ): Promise<void>;
}
