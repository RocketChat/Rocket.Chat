import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IMessage } from './IMessage';

/**
 * Handler for when a System message is sent.
 * System messages are messages that are not sent by a user, but by the system itself.
 */
export interface IPostSystemMessageSent {
    /**
     * Method called *after* the system message is sent to the other clients.
     */
    executePostSystemMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void>;
}
