import type { IHttp, IMessageBuilder, IPersistence, IRead } from '../accessors';
import type { IMessage } from './IMessage';

/** Handler called when an App wants to modify a message update in a destructive way. */
export interface IPreMessageUpdatedModify {
    /**
     * Enables the handler to signal to the Apps framework whether
     * this handler should actually be executed for the message
     * about to be updated.
     *
     * @param message The message which is being updated
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @returns whether to run the execute or not
     */
    checkPreMessageUpdatedModify?(message: IMessage, read: IRead, http: IHttp): Promise<boolean>;

    /**
     * Method which is to be used to destructively modify the message update.
     *
     * @param message The message about to be updated
     * @param builder The builder for modifying the message via methods
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence
     * @returns the resulting message
     */
    executePreMessageUpdatedModify(message: IMessage, builder: IMessageBuilder, read: IRead, http: IHttp, persistence: IPersistence): Promise<IMessage>;
}
