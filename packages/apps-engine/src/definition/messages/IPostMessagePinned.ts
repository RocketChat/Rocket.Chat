import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IMessagePinContext } from './IMessagePinContext';

/**
 * Handler for after a message has been pinned or unpinned
 */
export interface IPostMessagePinned {
    /**
     * Method called *after* the message has been pinned or unpinned.
     *
     * @param context The context
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence
     * @param modify An accessor to the modifier
     */
    executePostMessagePinned(context: IMessagePinContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void>;
}
