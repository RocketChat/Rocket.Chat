import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IMessage } from './IMessage';

/** Handler for after a dm message is sent to a bot. */
export interface IPostMessageSentToBot {
    /**
     * Method called *after* the message is sent to the other clients.
     *
     * @param message The message which was sent
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence
     */
    executePostMessageSentToBot(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void>;
}
