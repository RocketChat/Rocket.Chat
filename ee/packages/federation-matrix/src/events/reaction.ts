import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { Message } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { Users, Messages } from '@rocket.chat/models';
import emojione from 'emojione';

const logger = new Logger('federation-matrix:reaction');

export function reaction(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.reaction', async (data) => {
		try {
			logger.info('Received Matrix reaction event:', {
				event_id: data.event_id,
				room_id: data.room_id,
				sender: data.sender,
				relates_to: data.content?.['m.relates_to'],
			});

			const relatesTo = data.content?.['m.relates_to'];
			if (!relatesTo || relatesTo.rel_type !== 'm.annotation') {
				logger.debug('Invalid reaction event structure');
				return;
			}

			const targetEventId = relatesTo.event_id;
			const reactionKey = relatesTo.key;

			if (!targetEventId || !reactionKey) {
				logger.debug('Missing target event ID or reaction key');
				return;
			}

			const rcMessage = await Messages.findOneByFederationId(targetEventId);
			if (!rcMessage) {
				logger.debug(`No RC message mapping found for Matrix event ${targetEventId}`);
				return;
			}
			const rcMessageId = rcMessage._id;

			// Message already retrieved above

			const [userPart, domain] = data.sender.split(':');
			if (!userPart || !domain) {
				logger.error('Invalid Matrix sender ID format:', data.sender);
				return;
			}

			const username = userPart.substring(1);
			const user = await Users.findOneByUsername(username);
			if (!user) {
				return;
			}

			const reactionEmoji = emojione.toShort(reactionKey);

			await Message.reactToMessage(rcMessageId, reactionEmoji, user._id);

			await Messages.setFederationReactionEventId(user.username || username, rcMessageId, reactionEmoji, data.event_id);

			logger.debug('Matrix reaction processed successfully');
		} catch (error) {
			logger.error('Failed to process Matrix reaction:', error);
		}
	});

	emitter.on('homeserver.matrix.redaction', async (data) => {
		try {
			const redactedEventId = data.redacts;
			if (!redactedEventId) {
				return;
			}

			// First check if this is a reaction redaction by looking for messages with this reaction event ID
			const messageWithReaction = await Messages.findOneByFederationIdAndUsernameOnReactions(
				redactedEventId,
				data.sender.split(':')[0].substring(1),
			);
			if (!messageWithReaction) {
				return;
			}

			// Find which reaction was redacted
			let redactedReaction: string | null = null;
			if (messageWithReaction.reactions) {
				for (const [reaction, reactionData] of Object.entries(messageWithReaction.reactions)) {
					if (reactionData.federationReactionEventIds?.[redactedEventId]) {
						redactedReaction = reaction;
						break;
					}
				}
			}

			if (!redactedReaction) {
				return;
			}

			const messageId = messageWithReaction._id;
			const reaction = redactedReaction;

			const [userPart] = data.sender.split(':');
			const username = userPart.substring(1);
			const user = await Users.findOneByUsername(username);

			if (!user) {
				logger.debug('User not found for reaction redaction');
				return;
			}

			await Message.reactToMessage(user._id, reaction, messageId, false);

			await Messages.unsetFederationReactionEventId(redactedEventId, messageId, reaction);

			logger.debug('Matrix reaction redaction processed successfully');
		} catch (error) {
			logger.error('Failed to process Matrix reaction redaction:', error);
		}
	});
}
