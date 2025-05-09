import type { IMessage } from '../messages';
import type { IUser } from '../users';

export interface IModerationModify {
    /**
     * Provides a way for Apps to report a message.
     * @param messageId the messageId to report
     * @param description the description of the report
     * @param userId the userId to be reported
     * @param appId the app id
     */
    report(messageId: string, description: string, userId: string, appId: string): Promise<void>;

    /**
     * Provides a way for Apps to dismiss reports by message id.
     * @param messageId the messageId to dismiss reports
     * @param appId the app id
     */
    dismissReportsByMessageId(messageId: IMessage['id'], reason: string, action: string, appId: string): Promise<void>;

    /**
     * Provides a way for Apps to dismiss reports by user id.
     * @param userId the userId to dismiss reports
     * @param appId the app id
     */
    dismissReportsByUserId(userId: IUser['id'], reason: string, action: string, appId: string): Promise<void>;
}
