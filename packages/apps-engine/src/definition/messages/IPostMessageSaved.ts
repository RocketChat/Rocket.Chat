import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IMessage } from './IMessage';

/**
 * Handler for after a message was saved
 */
export interface IPostMessageSaved {
    /**
     * Method called *after* the message has been saved.
     *
     * @param message The message which was saved
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence
     * @param modify An accessor to the modifier
     */
    executePostMessageSaved(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void>;
}