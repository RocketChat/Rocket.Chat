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
