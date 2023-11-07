import { Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import * as Mailer from '../../app/mailer/server/api';
import { settings } from '../../app/settings/server';

export async function sendWelcomeEmail(to: string) {
	check(to, String);

	const email = to.trim();

	const user = await Users.findOneByEmailAddress(email, { projection: { _id: 1 } });

	if (!user) {
		return false;
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

		return true;
	} catch (error: any) {
		throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${error.message}`, {
			method: 'sendWelcomeEmail',
			message: error.message,
		});
	}
}
