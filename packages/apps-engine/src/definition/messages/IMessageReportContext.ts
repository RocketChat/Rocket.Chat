import type { IMessage } from '.';
import type { IUser } from '../users';

/**
 * The context of execution for the following events:
 * - IPostMessageReported
 */
export interface IMessageReportContext {
    /**
     * The message that has been reported
     */
    message: IMessage;
    /**
     * The user who reported the message
     */
    user: IUser;
    /**
     * The reason the message was reported
     */
    reason: string;
}
