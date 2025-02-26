import type { IHttp, IPersistence, IRead } from '../accessors';
import type { IMessage } from './IMessage';

/**  Handler which is called to determine whether a user is allowed to update a message or not. */
export interface IPreMessageUpdatedPrevent {
    /**
     * Enables the handler to signal to the Apps framework whether
     * this handler should actually be executed for the message
     * about to be updated.
     *
     * @param message The message which is being updated
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @returns whether to run the prevent or not
     */
    checkPreMessageUpdatedPrevent?(message: IMessage, read: IRead, http: IHttp): Promise<boolean>;

    /**
     * Method which is to be used to prevent a message from being updated.
     *
     * @param message The message about to be updated
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence storage
     * @returns whether to prevent the message from being updated
     */
    executePreMessageUpdatedPrevent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence): Promise<boolean>;
}
