import _ from 'underscore';

import { logger } from '../features/EmailInbox/logger';
import { DirectReplyIMAPInterceptor, POP3Helper } from '../lib/notifications/interceptDirectReplyEmails';
import type { ICachedSettings } from '../settings/CachedSettings';

export async function configureDirectReply(settings: ICachedSettings): Promise<void> {
	let client: DirectReplyIMAPInterceptor | POP3Helper | undefined;
	let configurationVersion = 0;
	let configurationQueue = Promise.resolve();

	const applyConfiguration = async (version: number): Promise<void> => {
		logger.info('Email Interceptor...');
		if (client) {
			const previousClient = client;
			client = undefined;
			await previousClient.stop();
		}

		if (version !== configurationVersion) {
			return;
		}

		const protocol = settings.get('Direct_Reply_Protocol');
		const isEnabled =
			settings.get('Direct_Reply_Enable') &&
			protocol &&
			settings.get('Direct_Reply_Host') &&
			settings.get('Direct_Reply_Port') &&
			settings.get('Direct_Reply_Username') &&
			settings.get('Direct_Reply_Password');

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
	};

	const startEmailInterceptor = _.debounce(() => {
		const version = configurationVersion;
		configurationQueue = configurationQueue
			.then(() => applyConfiguration(version))
			.catch((err) => {
				logger.error({ msg: 'Error configuring direct reply interceptor', err });
			});
	}, 1000);
	const handleSettingsChange = () => {
		configurationVersion += 1;
		startEmailInterceptor();
	};

	settings.watchByRegex(/^Direct_Reply_.+/, handleSettingsChange);

	handleSettingsChange();
}
