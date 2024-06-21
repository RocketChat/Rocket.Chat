import { Users } from '@rocket.chat/models';
import { TranslationKey } from '@rocket.chat/ui-contexts';

import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';

export async function sendSMTPTestEmail(this: { userId: string }) {
	const user = await Users.findOneById(this.userId);
	if (!user?.emails?.[0]?.address) {
		throw new Error('Invalid email');
	}

	try {
		await Mailer.send({
			to: user.emails[0].address,
			from: settings.get('From_Email'),
			subject: 'SMTP Test Email',
			html: '<p>You have successfully sent an email</p>',
		});
	} catch ({ message }: any) {
		throw new Error(`Error trying to send email: ${message}`);
	}
	return {
		message: 'Sending_your_mail_to_s' as TranslationKey,
		params: [user.emails[0].address],
	};
}
