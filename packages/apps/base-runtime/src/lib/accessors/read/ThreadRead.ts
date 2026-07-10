import type { IThreadRead } from '@rocket.chat/apps-engine/definition/accessors/IThreadRead';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class ThreadRead implements IThreadRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getThreadById(id: string): Promise<Array<IMessage>> {
		return bridgeCall<Array<IMessage>>(this.senderFn, 'getThreadBridge', 'doGetById', id, 'APP_ID');
	}
}
