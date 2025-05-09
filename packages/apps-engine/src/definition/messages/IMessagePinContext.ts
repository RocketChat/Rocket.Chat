import type { IMessage } from '.';
import type { IUser } from '../users';

/**
 * The context of execution for the following events:
 * - IPostMessagePinned
 */
export interface IMessagePinContext {
    /**
     * The message that was pinned or unpinned
     */
    message: IMessage;
    /**
     * The user who pinned the message
     */
    user: IUser;
    /**
     * If the message was pinned or unpinned
     */
    isPinned: boolean;
}
