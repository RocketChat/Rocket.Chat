import _ from 'underscore';

import { settings } from '../../../settings/server';
import { DirectReplyIMAPInterceptor, POP3Helper } from '../lib/interceptDirectReplyEmails.js';
import { logger } from '../../../../server/features/EmailInbox/logger';

let client: DirectReplyIMAPInterceptor | POP3Helper | undefined;
const startEmailInterceptor = _.debounce(async function () {
	logger.info('Email Interceptor...');
	const protocol = settings.get('Direct_Reply_Protocol');

	const isEnabled =
		settings.get('Direct_Reply_Enable') &&
		protocol &&
		settings.get('Direct_Reply_Host') &&
		settings.get('Direct_Reply_Port') &&
		settings.get('Direct_Reply_Username') &&
		settings.get('Direct_Reply_Password');

	if (client) {
		await client.stop();
	}

	if (!isEnabled) {
		logger.info('Email Interceptor Stopped...');
		return;
	}
	logger.info('Starting Email Interceptor...');

	if (protocol === 'IMAP') {
		client = new DirectReplyIMAPInterceptor();
		client.start();
	}

	if (protocol === 'POP') {
		client = new POP3Helper(settings.get('Direct_Reply_Frequency'));
		client.start();
	}
}, 1000);

settings.watchByRegex(/^Direct_Reply_.+/, startEmailInterceptor);

startEmailInterceptor();
