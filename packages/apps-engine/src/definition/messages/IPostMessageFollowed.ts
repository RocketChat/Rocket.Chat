import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IMessageFollowContext } from './IMessageFollowContext';

/**
 * Handler for after a message has been followed or unfollowed
 */
export interface IPostMessageFollowed {
    /**
     * Method called *after* the message has been followed or unfollowed.
     *
     * @param context The context
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     * @param persistence An accessor to the App's persistence
     * @param modify An accessor to the modifier
     */
    executePostMessageFollowed(context: IMessageFollowContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void>;
}
