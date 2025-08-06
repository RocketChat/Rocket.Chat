import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import { Message, FederationMatrix } from '@rocket.chat/core-services';
import type { Emitter } from '@rocket.chat/emitter';
import { Logger } from '@rocket.chat/logger';
import { Users, Messages } from '@rocket.chat/models'; // Rooms
import emojione from 'emojione';

import { convertExternalUserIdToInternalUsername } from '../helpers/identifiers';

const logger = new Logger('federation-matrix:reaction');

export function reaction(emitter: Emitter<HomeserverEventSignatures>) {
	emitter.on('homeserver.matrix.reaction', async (data) => {
		try {
			const isSetReaction = data.content?.['m.relates_to'];

			const reactionTargetEventId = isSetReaction?.event_id;
			const reactionKey = isSetReaction?.key;

			const [userPart, domain] = data.sender.split(':');
			if (!userPart || !domain) {
				logger.error('Invalid Matrix sender ID format:', data.sender);
				return;
			}

			const internalUsername = convertExternalUserIdToInternalUsername(data.sender);
			const user = await Users.findOneByUsername(internalUsername);
			if (!user) {
				logger.error(`No RC user mapping found for Matrix event ${reactionTargetEventId} ${internalUsername}`);
				return;
			}

			if (!isSetReaction) {
				logger.debug(`No relates_to content in reaction event`);
				return;
			}

			const rcMessage = await Messages.findOneByFederationId(reactionTargetEventId);
			if (!rcMessage) {
				logger.debug(`No RC message mapping found for Matrix event ${reactionTargetEventId}`);
				return;
			}

			const reactionEmoji = emojione.toShort(reactionKey);
			await Message.reactToMessage(user._id, reactionEmoji, rcMessage._id, true);
			await Messages.setFederationReactionEventId(internalUsername, rcMessage._id, reactionEmoji, data.event_id);
		} catch (error) {
			logger.error('Failed to process Matrix reaction:', error);
		}
	});

	emitter.on('homeserver.matrix.redaction', async (data) => {
		try {
			const redactedEventId = data.redacts;
			if (!redactedEventId) {
				logger.debug('No redacts field in redaction event');
				return;
			}

			const reactionEvent = await FederationMatrix.getEventById(redactedEventId);
			if (!reactionEvent || reactionEvent.type !== 'm.reaction') {
				logger.debug(`Event ${redactedEventId} is not a reaction event`);
				return;
			}

			const reactionContent = reactionEvent.content?.['m.relates_to'];
			if (!reactionContent) {
				logger.debug('No relates_to content in reaction event');
				return;
			}

			const targetMessageEventId = reactionContent.event_id;
			const reactionKey = reactionContent.key;

			const rcMessage = await Messages.findOneByFederationId(targetMessageEventId);
			if (!rcMessage) {
				logger.debug(`No RC message found for event ${targetMessageEventId}`);
				return;
			}

			const internalUsername = convertExternalUserIdToInternalUsername(data.sender);
			const user = await Users.findOneByUsername(internalUsername);
			if (!user) {
				logger.debug(`User not found: ${internalUsername}`);
				return;
			}

			const reactionEmoji = emojione.toShort(reactionKey);
			await Message.reactToMessage(user._id, reactionEmoji, rcMessage._id, false);
			await Messages.unsetFederationReactionEventId(redactedEventId, rcMessage._id, reactionEmoji);
		} catch (error) {
			logger.error('Failed to process Matrix reaction redaction:', error);
		}
	});
}
