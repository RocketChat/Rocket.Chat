import type { IMessageUpdater } from '../../definition/accessors/IMessageUpdater';
import type { Reaction } from '../../definition/messages';
import type { AppBridges } from '../bridges';

export class MessageUpdater implements IMessageUpdater {
	constructor(
		private readonly bridges: AppBridges,
		private readonly appId: string,
	) {}

	public async addReaction(messageId: string, userId: string, reaction: Reaction): Promise<void> {
		return this.bridges.getMessageBridge().doAddReaction(messageId, userId, reaction, this.appId);
	}

	public async removeReaction(messageId: string, userId: string, reaction: Reaction): Promise<void> {
		return this.bridges.getMessageBridge().doRemoveReaction(messageId, userId, reaction, this.appId);
	}
}
