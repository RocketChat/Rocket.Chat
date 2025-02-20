import { api } from '@rocket.chat/core-services';
import { Subscriptions, Users, Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { i18n } from './i18n';
import { isUserIdFederated } from './isUserIdFederated';
import { notifyOnUserChange, notifyOnSubscriptionChangedByUserId } from '../../app/lib/server/lib/notifyListener';
import * as Mailer from '../../app/mailer/server/api';
import { settings } from '../../app/settings/server';

const sendResetNotification = async function (uid: string): Promise<void> {
	const user = await Users.findOneById(uid, {});
	if (!user) {
		throw new Meteor.Error('invalid-user');
	}

	const language = user.language || settings.get('Language') || 'en';
	const addresses = user.emails?.filter(({ verified }) => verified).map((e) => e.address);
	if (!addresses?.length) {
		return;
	}

	const t = i18n.getFixedT(language);
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
			throw new Meteor.Error(
				'error-email-send-failed',
				`Error trying to send email: ${error instanceof Error ? error.message : String(error)}`,
				{
					function: 'resetUserE2EEncriptionKey',
					message: error instanceof Error ? error.message : String(error),
				},
			);
		}
	}
};

export async function resetUserE2EEncriptionKey(uid: string, notifyUser: boolean): Promise<boolean> {
	if (notifyUser) {
		await sendResetNotification(uid);
	}

	const isUserFederated = await isUserIdFederated(uid);
	if (isUserFederated) {
		throw new Meteor.Error('error-not-allowed', 'Federated Users cant have TOTP', { function: 'resetTOTP' });
	}

	// force logout the live sessions
	await api.broadcast('user.forceLogout', uid);

	const responses = await Promise.all([Users.resetE2EKey(uid), Subscriptions.resetUserE2EKey(uid), Rooms.removeUserFromE2EEQueue(uid)]);

	if (responses[1]?.modifiedCount) {
		void notifyOnSubscriptionChangedByUserId(uid);
	}

	// Force the user to logout, so that the keys can be generated again
	await Users.unsetLoginTokens(uid);

	void notifyOnUserChange({ clientAction: 'updated', id: uid, diff: { 'services.resume.loginTokens': [] } });

	return true;
}
