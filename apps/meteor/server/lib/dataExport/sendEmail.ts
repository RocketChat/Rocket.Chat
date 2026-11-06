import type { IUser } from '@rocket.chat/core-typings';

import { getUserEmailAddress } from '../../../lib/getUserEmailAddress';
import { settings } from '../../settings';
import * as Mailer from '../notifications/email/api';

export const sendEmail = async (userData: Pick<IUser, 'name' | 'emails'>, subject: string, body: string): Promise<void> => {
	const emailAddress = getUserEmailAddress(userData);

	if (!emailAddress) {
		throw new Error('no email address found for user');
	}

	const to = `${userData.name} <${emailAddress}>`;
	const from = settings.get('From_Email') as string;

	if (!Mailer.checkAddressFormat(emailAddress)) {
		return;
	}

	await Mailer.send({
		to,
		from,
		subject,
		html: body,
	});
};
