import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { i18n } from '../../../../server/lib/i18n';
import { isUserIdFederated } from '../../../../server/lib/isUserIdFederated';
import { notifyOnUserChange } from '../../../lib/server/lib/notifyListener';
import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';

const sendResetNotification = async function (uid: string): Promise<void> {
	const user = await Users.findOneById<Pick<IUser, 'language' | 'emails'>>(uid, {
		projection: { language: 1, emails: 1 },
	});
	if (!user) {
		throw new Meteor.Error('invalid-user');
	}

	const language = user.language || settings.get('Language') || 'en';
	const addresses = user.emails?.filter(({ verified }) => Boolean(verified)).map((e) => e.address);
	if (!addresses?.length) {
		return;
	}

	const t = (s: string): string => i18n.t(s, { lng: language });
	const text = `
	${t('Your_TOTP_has_been_reset')}

	${t('TOTP_Reset_Other_Key_Warning')}
	`;
	const html = `
		<p>${t('Your_TOTP_has_been_reset')}</p>
		<p>${t('TOTP_Reset_Other_Key_Warning')}</p>
	`;

	const from = settings.get('From_Email');
	const subject = t('TOTP_reset_email');

	for await (const address of addresses) {
		try {
			await Mailer.send({
				to: address,
				from,
				subject,
				text,
				html,
			} as any);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${message}`, {
				function: 'resetUserTOTP',
				message,
			});
		}
	}
};

export async function resetTOTP(userId: string, notifyUser = false): Promise<boolean> {
	if (notifyUser) {
		await sendResetNotification(userId);
	}

	const isUserFederated = await isUserIdFederated(userId);
	if (isUserFederated) {
		throw new Meteor.Error('error-not-allowed', 'Federated Users cant have TOTP', { function: 'resetTOTP' });
	}

	const result = await Users.resetTOTPById(userId);

	if (result?.modifiedCount === 1) {
		await Users.unsetLoginTokens(userId);

		void notifyOnUserChange({
			clientAction: 'updated',
			id: userId,
			diff: {
				'services.resume.loginTokens': [],
			},
		});
		return true;
	}

	return false;
}
