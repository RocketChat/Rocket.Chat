import { Message, FederationMatrix } from '@rocket.chat/core-services';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Users, Messages } from '@rocket.chat/models'; // Rooms
import emojione from 'emojione';

const logger = new Logger('federation-matrix:reaction');

export function reaction() {
	federationSDK.eventEmitterService.on('homeserver.matrix.reaction', async ({ event, event_id: eventId }) => {
		try {
			const isSetReaction = event.content?.['m.relates_to'];

			const reactionTargetEventId = isSetReaction?.event_id;
			const reactionKey = isSetReaction?.key;

			const [userPart, domain] = event.sender.split(':');
			if (!userPart || !domain) {
				logger.error({ sender: event.sender, msg: 'Invalid Matrix sender ID format' });
				return;
			}

			const internalUsername = event.sender;
			const user = await Users.findOneByUsername(internalUsername);
			if (!user) {
				logger.error({ reactionTargetEventId, internalUsername, msg: 'No RC user mapping found for Matrix event' });
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
			await Messages.setFederationReactionEventId(internalUsername, rcMessage._id, reactionEmoji, eventId);
		} catch (error) {
			logger.error(error, 'Failed to process Matrix reaction');
		}
	});

	federationSDK.eventEmitterService.on('homeserver.matrix.redaction', async ({ event }) => {
		try {
			const redactedEventId = event.redacts;
			if (!redactedEventId) {
				logger.debug('No redacts field in redaction event');
				return;
			}

			const reactionEvent = await FederationMatrix.getEventById(redactedEventId);
			if (!reactionEvent || reactionEvent.event.type !== 'm.reaction') {
				logger.debug(`Event ${redactedEventId} is not a reaction event`);
				return;
			}

			const reactionContent = reactionEvent.event.content?.['m.relates_to'];
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

			const internalUsername = event.sender;
			const user = await Users.findOneByUsername(internalUsername);
			if (!user) {
				logger.debug(`User not found: ${internalUsername}`);
				return;
			}

			const reactionEmoji = emojione.toShort(reactionKey);
			await Message.reactToMessage(user._id, reactionEmoji, rcMessage._id, false);
			await Messages.unsetFederationReactionEventId(redactedEventId, rcMessage._id, reactionEmoji);
		} catch (error) {
			logger.error(error, 'Failed to process Matrix reaction redaction');
		}
	});
}
