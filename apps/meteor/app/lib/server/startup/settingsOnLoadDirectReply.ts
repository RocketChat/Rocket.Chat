import _ from 'underscore';

import { settings } from '../../../settings/server';
import { DirectReplyIMAPInterceptor, POP3Helper } from '../lib/interceptDirectReplyEmails.js';

let client: DirectReplyIMAPInterceptor | POP3Helper | undefined;
const startEmailIntercepter = _.debounce(async function () {
	console.log('Email Intercepter...');
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
		console.log('Email Intercepter Stopped...');
		return;
	}
	console.log('Starting Email Intercepter...');

	if (protocol === 'IMAP') {
		client = new DirectReplyIMAPInterceptor();
		client.start();
	}

	if (protocol === 'POP') {
		client = new POP3Helper(settings.get('Direct_Reply_Frequency'));
		client.start();
	}
}, 1000);

settings.watchByRegex(/^Direct_Reply_.+/, startEmailIntercepter);

startEmailIntercepter();
