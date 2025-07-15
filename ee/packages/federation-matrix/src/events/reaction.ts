import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { Message } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { Users, MatrixBridgedMessage, Messages } from '@rocket.chat/models';

import { convertUnicodeToEmoji } from '../utils/emojiConverter';

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

			const rcMessageId = await MatrixBridgedMessage.getLocalMessageId(targetEventId);
			if (!rcMessageId) {
				logger.debug(`No RC message mapping found for Matrix event ${targetEventId}`);
				return;
			}

			const message = await Messages.findOneById(rcMessageId);
			if (!message) {
				logger.debug(`RC message ${rcMessageId} not found`);
				return;
			}

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

			const reactionEmoji = convertUnicodeToEmoji(reactionKey);

			await Message.reactToMessage(rcMessageId, reactionEmoji, user._id);

			const reactionMappingKey = `${rcMessageId}_reaction_${reactionEmoji}`;
			await MatrixBridgedMessage.createOrUpdate(reactionMappingKey, data.event_id);

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

			const reactionMappingKey = await MatrixBridgedMessage.getLocalMessageId(redactedEventId);
			if (!reactionMappingKey || !reactionMappingKey.includes('_reaction_')) {
				return;
			}

			const [messageId, , reaction] = reactionMappingKey.split('_');

			const [userPart] = data.sender.split(':');
			const username = userPart.substring(1);
			const user = await Users.findOneByUsername(username);

			if (!user) {
				logger.debug('User not found for reaction redaction');
				return;
			}

			await Message.reactToMessage(user._id, reaction, messageId, false);

			await MatrixBridgedMessage.removeByLocalMessageId(reactionMappingKey);

			logger.debug('Matrix reaction redaction processed successfully');
		} catch (error) {
			logger.error('Failed to process Matrix reaction redaction:', error);
		}
	});
}
