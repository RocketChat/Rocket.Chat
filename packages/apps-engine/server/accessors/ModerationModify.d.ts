import type { IModerationModify } from '../../definition/accessors';
import type { IMessage } from '../../definition/messages';
import type { IUser } from '../../definition/users';
import type { ModerationBridge } from '../bridges';
export declare class ModerationModify implements IModerationModify {
    private moderationBridge;
    constructor(moderationBridge: ModerationBridge, appId: string);
    report(messageId: string, description: string, userId: string, appId: string): Promise<void>;
    dismissReportsByMessageId(messageId: IMessage['id'], reason: string, action: string, appId: string): Promise<void>;
    dismissReportsByUserId(userId: IUser['id'], reason: string, action: string, appId: string): Promise<void>;
}
