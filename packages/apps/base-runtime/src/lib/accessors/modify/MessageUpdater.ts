import type { IMessageUpdater } from '@rocket.chat/apps-engine/definition/accessors/IMessageUpdater';
import type { Reaction } from '@rocket.chat/apps-engine/definition/messages';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class MessageUpdater implements IMessageUpdater {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public async addReaction(messageId: string, userId: string, reaction: Reaction): Promise<void> {
		await bridgeCall(this.senderFn, 'getMessageBridge', 'doAddReaction', messageId, userId, reaction, 'APP_ID');
	}

	public async removeReaction(messageId: string, userId: string, reaction: Reaction): Promise<void> {
		await bridgeCall(this.senderFn, 'getMessageBridge', 'doRemoveReaction', messageId, userId, reaction, 'APP_ID');
	}
}
