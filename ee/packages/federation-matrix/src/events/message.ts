import { FederationMatrix, Message } from '@rocket.chat/core-services';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { Users, Rooms, Messages } from '@rocket.chat/models';

import { getThreadMessageId } from '../helpers/getThreadMessageId';

const logger = new Logger('federation-matrix:message');

export function message() {
	federationSDK.eventEmitterService.on('homeserver.matrix.message', async (event) => {
		try {
			await FederationMatrix.saveFederationMessage(event);
		} catch (err) {
			logger.error({ msg: 'Error processing Matrix message', err });
			throw err;
		}
	});

	federationSDK.eventEmitterService.on('homeserver.matrix.encrypted', async ({ event, event_id: eventId }) => {
		try {
			if (!event.content.ciphertext) {
				logger.debug('No message content found in event');
				return;
			}

			// at this point we know for sure the user already exists
			const user = await Users.findOneByUsername(event.sender);
			if (!user) {
				throw new Error(`User not found for sender: ${event.sender}`);
			}

			const room = await Rooms.findOne({ 'federation.mrid': event.room_id });
			if (!room) {
				throw new Error(`No mapped room found for room_id: ${event.room_id}`);
			}

			const relation = event.content['m.relates_to'];

			// SPEC: For example, an m.thread relationship type denotes that the event is part of a “thread” of messages and should be rendered as such.
			const hasRelation = relation && 'rel_type' in relation;

			const isThreadMessage = hasRelation && relation.rel_type === 'm.thread';

			const threadRootEventId = isThreadMessage && relation.event_id;

			// SPEC: Though rich replies form a relationship to another event, they do not use rel_type to create this relationship.
			// Instead, a subkey named m.in_reply_to is used to describe the reply’s relationship,
			const isRichReply = relation && !('rel_type' in relation) && 'm.in_reply_to' in relation;

			const quoteMessageEventId = isRichReply && relation['m.in_reply_to']?.event_id;

			const thread = threadRootEventId ? await getThreadMessageId(threadRootEventId) : undefined;

			const isEditedMessage = hasRelation && relation.rel_type === 'm.replace';
			if (isEditedMessage && relation.event_id) {
				logger.debug('Received edited message from Matrix, updating existing message');
				const originalMessage = await Messages.findOneByFederationId(relation.event_id);
				if (!originalMessage) {
					logger.error({ event_id: relation.event_id, msg: 'Original message not found for edit' });
					return;
				}
				if (originalMessage.federation?.eventId !== relation.event_id) {
					return;
				}
				if (originalMessage.content?.ciphertext === event.content.ciphertext) {
					logger.debug('No changes in message content, skipping update');
					return;
				}

				if (quoteMessageEventId) {
					await Message.updateMessage(
						{
							...originalMessage,
							content: {
								algorithm: event.content.algorithm,
								ciphertext: event.content.ciphertext,
							},
						},
						user,
						originalMessage,
					);
					return;
				}

				await Message.updateMessage(
					{
						...originalMessage,
						content: {
							algorithm: event.content.algorithm,
							ciphertext: event.content.ciphertext,
						},
					},
					user,
					originalMessage,
				);
				return;
			}

			if (quoteMessageEventId) {
				const originalMessage = await Messages.findOneByFederationId(quoteMessageEventId);
				if (!originalMessage) {
					logger.error({ quoteMessageEventId, msg: 'Original message not found for quote' });
					return;
				}
				await Message.saveMessageFromFederation({
					fromId: user._id,
					rid: room._id,
					e2e_content: {
						algorithm: event.content.algorithm,
						ciphertext: event.content.ciphertext,
					},
					federation_event_id: eventId,
					thread,
					ts: new Date(event.origin_server_ts),
				});
				return;
			}

			await Message.saveMessageFromFederation({
				fromId: user._id,
				rid: room._id,
				e2e_content: {
					algorithm: event.content.algorithm,
					ciphertext: event.content.ciphertext,
				},
				federation_event_id: eventId,
				thread,
				ts: new Date(event.origin_server_ts),
			});
		} catch (err) {
			logger.error({ msg: 'Error processing Matrix message', err });
		}
	});

	federationSDK.eventEmitterService.on('homeserver.matrix.redaction', async ({ event }) => {
		try {
			const redactedEventId = event.redacts;
			if (!redactedEventId) {
				logger.debug('No redacts field in redaction event');
				return;
			}

			const messageEvent = await FederationMatrix.getEventById(redactedEventId);
			if (messageEvent?.event.type !== 'm.room.message') {
				logger.debug({ msg: 'Event is not a message event', eventId: redactedEventId });
				return;
			}

			const rcMessage = await Messages.findOneByFederationId(event.redacts);
			if (!rcMessage) {
				logger.debug({ msg: 'No RC message found for event', eventId: event.redacts });
				return;
			}
			const internalUsername = event.sender;
			const user = await Users.findOneByUsername(internalUsername);
			if (!user) {
				logger.debug({ msg: 'User not found', username: internalUsername });
				return;
			}

			await Message.deleteMessage(user, rcMessage);
		} catch (err) {
			logger.error({ msg: 'Failed to process Matrix removal redaction', err });
		}
	});
}
