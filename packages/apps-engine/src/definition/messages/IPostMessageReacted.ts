import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IMessageReactionContext } from './IMessageReactionContext';

/**
 * Handler for after a message get a reaction or a reaction
 * got removed
 */
export interface IPostMessageReacted {
    /**
     * Method called *after* the message has been reacted.
     *
     * @param context The context of the reaction
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence
     * @param modify An accessor to the modifier
     */
    executePostMessageReacted(context: IMessageReactionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void>;
}
