import type { IUser } from '@rocket.chat/core-typings';

import * as Mailer from '../../../app/mailer';
import { settings } from '../../../app/settings/server';
import { getUserEmailAddress } from '../../../lib/getUserEmailAddress';

export const sendEmail = (userData: Pick<IUser, 'name' | 'emails'>, subject: string, body: string): void => {
	const emailAddress = getUserEmailAddress(userData);

	if (!emailAddress) {
		throw new Error('no email address found for user');
	}

	const to = `${userData.name} <${emailAddress}>`;
	const from = settings.get('From_Email') as string;

	if (!Mailer.checkAddressFormat(emailAddress)) {
		return;
	}

	Mailer.send({
		to,
		from,
		subject,
		html: body,
	});
};
