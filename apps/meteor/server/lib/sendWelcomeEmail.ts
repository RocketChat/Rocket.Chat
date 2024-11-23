import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import * as Mailer from '../../app/mailer/server/api';
import { settings } from '../../app/settings/server';
import { isSMTPConfigured } from '../../app/utils/server/functions/isSMTPConfigured';

export async function sendWelcomeEmail(to: string): Promise<void> {
	if (!isSMTPConfigured()) {
		throw new Meteor.Error('error-email-send-failed', 'SMTP is not configured', {
			method: 'sendWelcomeEmail',
		});
	}

	const email = to.trim();

	const user = await Users.findOneByEmailAddress(email, { projection: { _id: 1 } });

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'sendWelcomeEmail',
		});
	}

	try {
		let html = '';
		Mailer.getTemplate('Accounts_UserAddedEmail_Email', (template) => {
			html = template;
		});

		await Mailer.send({
			to: email,
			from: settings.get('From_Email'),
			subject: settings.get('Accounts_UserAddedEmail_Subject'),
			html,
		});
	} catch (error: any) {
		throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${error.message}`, {
			method: 'sendWelcomeEmail',
			message: error.message,
		});
	}
}
