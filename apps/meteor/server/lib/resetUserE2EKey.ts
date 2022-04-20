import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IUser } from '@rocket.chat/core-typings';

import { Users, Subscriptions } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import * as Mailer from '../../app/mailer';

const sendResetNotitification = function (uid: string): void {
	const user: IUser = Users.findOneById(uid, {});
	if (!user) {
		throw new Meteor.Error('invalid-user');
	}

	const language = user.language || settings.get('Language') || 'en';
	const addresses = user.emails?.filter(({ verified }) => verified).map((e) => e.address);
	if (!addresses?.length) {
		return;
	}

	const t = (s: string): string => TAPi18n.__(s, { lng: language });
	const text = `
	${t('Your_e2e_key_has_been_reset')}

	${t('E2E_Reset_Email_Content')}
	`;
	const html = `
		<p>${t('Your_e2e_key_has_been_reset')}</p>
		<p>${t('E2E_Reset_Email_Content')}</p>
	`;

	const from = settings.get('From_Email');
	const subject = t('E2E_key_reset_email');

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
					function: 'resetUserE2EEncriptionKey',
					message: error.message,
				});
			}
		});
	}
};

export function resetUserE2EEncriptionKey(uid: string, notifyUser: boolean): boolean {
	if (notifyUser) {
		sendResetNotitification(uid);
	}

	Users.resetE2EKey(uid);
	Subscriptions.resetUserE2EKey(uid);

	// Force the user to logout, so that the keys can be generated again
	Users.unsetLoginTokens(uid);

	return true;
}
