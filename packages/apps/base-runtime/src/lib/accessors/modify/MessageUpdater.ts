import type { IMessageUpdater } from '@rocket.chat/apps-engine/definition/accessors/IMessageUpdater';
import type { Reaction } from '@rocket.chat/apps-engine/definition/messages';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class MessageUpdater implements IMessageUpdater {
	constructor(private readonly bridges: RemoteBridges) {}

	public async addReaction(messageId: string, userId: string, reaction: Reaction): Promise<void> {
		await this.bridges.getMessageBridge().doAddReaction(messageId, userId, reaction, 'APP_ID');
	}

	public async removeReaction(messageId: string, userId: string, reaction: Reaction): Promise<void> {
		await this.bridges.getMessageBridge().doRemoveReaction(messageId, userId, reaction, 'APP_ID');
	}
}
