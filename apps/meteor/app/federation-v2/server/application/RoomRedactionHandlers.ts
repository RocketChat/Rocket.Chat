import type { IMessage } from '@rocket.chat/core-typings';

import type { FederatedUser } from '../domain/FederatedUser';
import { Federation } from '../Federation';
import type { RocketChatMessageAdapter } from '../infrastructure/rocket-chat/adapters/Message';

export interface IRoomRedactionHandlers {
	handle(): Promise<void>;
}

class DeleteMessageHandler implements IRoomRedactionHandlers {
	constructor(
		private readonly internalMessageAdapter: RocketChatMessageAdapter,
		private readonly message: IMessage,
		private readonly federatedUser: FederatedUser,
	) {}

	public async handle(): Promise<void> {
		await this.internalMessageAdapter.deleteMessage(this.message, this.federatedUser);
	}
}

class UnreactToMessageHandler implements IRoomRedactionHandlers {
	constructor(
		private readonly internalMessageAdapter: RocketChatMessageAdapter,
		private readonly message: IMessage,
		private readonly federatedUser: FederatedUser,
		private readonly redactsEvents: string,
	) {}

	public async handle(): Promise<void> {
		const normalizedEventId = Federation.escapeExternalFederationEventId(this.redactsEvents);
		const reaction = Object.keys(this.message.reactions || {}).find(
			(key) =>
				this.message.reactions?.[key]?.federationReactionEventIds?.[normalizedEventId] === this.federatedUser.getUsername() &&
				this.message.reactions?.[key]?.usernames?.includes(this.federatedUser.getUsername() || ''),
		);
		if (!reaction) {
			return;
		}
		await this.internalMessageAdapter.unreactToMessage(this.federatedUser, this.message, reaction, this.redactsEvents);
	}
}

export const getRedactMessageHandler = async (
	internalMessageAdapter: RocketChatMessageAdapter,
	redactsEvent: string,
	federatedUser: FederatedUser,
): Promise<IRoomRedactionHandlers | undefined> => {
	const message = await internalMessageAdapter.getMessageByFederationId(redactsEvent);
	const messageWithReaction = await internalMessageAdapter.findOneByFederationIdOnReactions(redactsEvent, federatedUser);
	if (!message && !messageWithReaction) {
		return;
	}
	if (messageWithReaction) {
		return new UnreactToMessageHandler(internalMessageAdapter, messageWithReaction, federatedUser, redactsEvent);
	}
	if (message) {
		return new DeleteMessageHandler(internalMessageAdapter, message, federatedUser);
	}
};
