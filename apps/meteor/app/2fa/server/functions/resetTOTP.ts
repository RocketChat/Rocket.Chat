import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IUser } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import * as Mailer from '../../../mailer';
import { Users } from '../../../models/server/raw/index';

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

	const t = (s: string): string => TAPi18n.__(s, { lng: language });
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

	for (const address of addresses) {
		Meteor.defer(() => {
			try {
				Mailer.send({
					to: address,
					from,
					subject,
					text,
					html,
				} as any);
			} catch (error) {
				throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${error.message}`, {
					function: 'resetUserTOTP',
					message: error.message,
				});
			}
		});
	}
};

export async function resetTOTP(userId: string, notifyUser = false): Promise<boolean> {
	if (notifyUser) {
		await sendResetNotification(userId);
	}

	const result = await Users.resetTOTPById(userId);

	if (result?.modifiedCount === 1) {
		await Users.unsetLoginTokens(userId);
		return true;
	}

	return false;
}
