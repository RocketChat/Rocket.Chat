import type { IMessage } from '.';
import type { IUser } from '../users';

/**
 * The context of execution for the following events:
 * - IPostMessageReacted
 */
export interface IMessageReactionContext {
    /**
     * The reaction itself
     */
    reaction: string;
    /**
     * If the reaction was removed or added from the message
     */
    isReacted: boolean;
    /**
     * The message that recieved the reaction
     */
    message: IMessage;
    /**
     * The user who reacted to the message
     */
    user: IUser;
}
