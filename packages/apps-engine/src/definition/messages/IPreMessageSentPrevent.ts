import type { IHttp, IPersistence, IRead } from '../accessors';
import type { IMessage } from './IMessage';

/**  Handler which is called to determine whether a user is allowed to send a message or not. */
export interface IPreMessageSentPrevent {
    /**
     * Enables the handler to signal to the Apps framework whether
     * this handler should actually be executed for the message
     * about to be sent.
     *
     * @param message The message which is being sent
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @returns whether to run the prevent or not
     */
    checkPreMessageSentPrevent?(message: IMessage, read: IRead, http: IHttp): Promise<boolean>;

    /**
     * Method which is to be used to prevent a message from being sent.
     *
     * @param message The message about to be sent
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence storage
     * @returns whether to prevent the message from being sent
     */
    executePreMessageSentPrevent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence): Promise<boolean>;
}
