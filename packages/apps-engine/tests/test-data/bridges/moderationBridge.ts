import type { IMessage } from '../../../src/definition/messages';
import type { IUser } from '../../../src/definition/users';
import { ModerationBridge } from '../../../src/server/bridges';

export class TestsModerationBridge extends ModerationBridge {
    public report(messageId: string, description: string, userId: string, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public dismissReportsByMessageId(messageId: IMessage['id'], reason: string, action: string, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public dismissReportsByUserId(userId: IUser['id'], reason: string, action: string, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
