import type { IMessage } from '.';
import type { IUser } from '../users';

/**
 * The context of execution for the following events:
 * - IPostMessageFollowed
 */
export interface IMessageFollowContext {
    /**
     * The message that was followed or unfollowed
     */
    message: IMessage;
    /**
     * The user who follow the message
     */
    user: IUser;
    /**
     * If the message was followed or unfollowed
     */
    isFollowed: boolean;
}
