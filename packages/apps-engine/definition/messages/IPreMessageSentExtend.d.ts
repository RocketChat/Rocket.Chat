import type { IHttp, IMessageExtender, IPersistence, IRead } from '../accessors';
import type { IMessage } from './IMessage';
/** Handler called when an App wants to enrich a message. */
export interface IPreMessageSentExtend {
    /**
     * Enables the handler to signal to the Apps framework whether
     * this handler should actually be executed for the message
     * about to be sent.
     *
     * @param message The message which is being sent
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @returns whether to run the execute or not
     */
    checkPreMessageSentExtend?(message: IMessage, read: IRead, http: IHttp): Promise<boolean>;
    /**
     * Method which is to be used to non-destructively enrich the message.
     *
     * @param message The message about to be sent
     * @param extend An accessor for modifying the message non-destructively
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence storage
     * @returns the resulting message
     */
    executePreMessageSentExtend(message: IMessage, extend: IMessageExtender, read: IRead, http: IHttp, persistence: IPersistence): Promise<IMessage>;
}
