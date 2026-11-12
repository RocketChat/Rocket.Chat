import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/index.js';

import { ThreadBridge } from '../../../src/server/bridges/ThreadBridge.js';

export class TestsThreadBridge extends ThreadBridge {
	public getById(messageId: string, appId: string): Promise<Array<IMessage>> {
		throw new Error('Method not implemented.');
	}
}
