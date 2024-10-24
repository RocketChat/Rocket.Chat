import { MeteorError } from '@rocket.chat/core-services';

import * as Mailer from '../../../../mailer/server/api';
import { settings } from '../../../../settings/server';
import type { SaveUserData } from './saveUser';

let html = '';
let passwordChangedHtml = '';
Meteor.startup(() => {
	Mailer.getTemplate('Accounts_UserAddedEmail_Email', (template) => {
		html = template;
	});

	Mailer.getTemplate('Password_Changed_Email', (template) => {
		passwordChangedHtml = template;
	});
});

export async function sendUserEmail(subject: string, html: string, userData: SaveUserData): Promise<void> {
	if (!userData.email) {
		return;
	}

	const email = {
		to: userData.email,
		from: settings.get<string>('From_Email'),
		subject,
		html,
		data: {
			email: userData.email,
			password: userData.password,
			...(typeof userData.name !== 'undefined' ? { name: userData.name } : {}),
		},
	};

	try {
		await Mailer.send(email);
	} catch (error) {
		const errorMessage = typeof error === 'object' && error && 'message' in error ? error.message : '';

		throw new MeteorError('error-email-send-failed', `Error trying to send email: ${errorMessage}`, {
			function: 'RocketChat.saveUser',
			message: errorMessage,
		});
	}
}

export async function sendWelcomeEmail(userData: SaveUserData) {
	return sendUserEmail(settings.get('Accounts_UserAddedEmail_Subject'), html, userData);
}

export async function sendPasswordEmail(userData: SaveUserData) {
	return sendUserEmail(settings.get('Password_Changed_Email_Subject'), passwordChangedHtml, userData);
}
