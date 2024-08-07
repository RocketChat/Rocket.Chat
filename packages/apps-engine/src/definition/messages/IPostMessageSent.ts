import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IMessage } from './IMessage';

/** Handler for after a message is sent. */
export interface IPostMessageSent {
    /**
     * Enables the handler to signal to the Apps framework whether
     * this handler should actually be executed for after the message
     * has been sent.
     *
     * @param message The message which was sent
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @returns whether to run the executor function
     */
    checkPostMessageSent?(message: IMessage, read: IRead, http: IHttp): Promise<boolean>;

    /**
     * Method called *after* the message is sent to the other clients.
     *
     * @param message The message which was sent
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence
     */
    executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void>;
}
