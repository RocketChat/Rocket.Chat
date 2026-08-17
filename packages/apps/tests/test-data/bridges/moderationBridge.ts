import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

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
