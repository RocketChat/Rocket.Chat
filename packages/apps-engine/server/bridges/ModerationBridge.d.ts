import { BaseBridge } from './BaseBridge';
import type { IMessage } from '../../definition/messages';
import type { IUser } from '../../definition/users';
export declare abstract class ModerationBridge extends BaseBridge {
    doReport(messageId: IMessage['id'], description: string, userId: string, appId: string): Promise<void>;
    doDismissReportsByMessageId(messageId: IMessage['id'], reason: string, action: string, appId: string): Promise<void>;
    doDismissReportsByUserId(userId: IUser['id'], reason: string, action: string, appId: string): Promise<void>;
    protected abstract report(messageId: string, description: string, userId: string, appId: string): Promise<void>;
    protected abstract dismissReportsByMessageId(messageId: string, reason: string, action: string, appId: string): Promise<void>;
    protected abstract dismissReportsByUserId(userId: string, reason: string, action: string, appId: string): Promise<void>;
    private hasWritePermission;
}
