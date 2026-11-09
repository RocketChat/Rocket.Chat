import type { IThreadRead } from '@rocket.chat/apps-engine/definition/accessors/IThreadRead.js';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages/index.js';

import { bridgeCall } from '../../bridges/bridgeCall.js';
import type * as Messenger from '../../messenger.js';

export class ThreadRead implements IThreadRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async getThreadById(id: string): Promise<Array<IMessage> | undefined> {
		const messages = await bridgeCall<Array<IMessage> | null>(this.senderFn, 'getThreadBridge', 'doGetById', id, 'APP_ID');

		return messages ?? undefined;
	}
}
