import _ from 'underscore';

import { DirectReplyIMAPInterceptor, POP3Helper } from '../../app/lib/server/lib/interceptDirectReplyEmails.js';
import type { ICachedSettings } from '../../app/settings/server/CachedSettings';
import { logger } from '../features/EmailInbox/logger';

export async function configureDirectReply(settings: ICachedSettings): Promise<void> {
	let client: DirectReplyIMAPInterceptor | POP3Helper | undefined;
	const startEmailInterceptor = _.debounce(async () => {
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
			await client.start();
		}

		if (protocol === 'POP') {
			client = new POP3Helper(settings.get('Direct_Reply_Frequency'));
			client.start();
		}
	}, 1000);

	settings.watchByRegex(/^Direct_Reply_.+/, startEmailInterceptor);

	void startEmailInterceptor();
}
