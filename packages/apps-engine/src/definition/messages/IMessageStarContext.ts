import type { IMessage } from '.';
import type { IUser } from '../users';

/**
 * The context of execution for the following events:
 * - IPostMessageStarred
 */
export interface IMessageStarContext {
    /**
     * The message that was starred or unstarred
     */
    message: IMessage;
    /**
     * The user who starred the message
     */
    user: IUser;
    /**
     * If the message was starred or unstarred
     */
    isStarred: boolean;
}
