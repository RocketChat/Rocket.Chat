import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import * as Mailer from '../../app/mailer/server/api';
import { settings } from '../../app/settings/server';
import { i18n } from './i18n';
import { isUserIdFederated } from './isUserIdFederated';

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

	const t = (s: string): string => i18n.t(s, { lng: language });
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

const addUserToE2EKeysWaitingQueue = async (uid: string): Promise<void> => {
	const subscribedRoomIds = (await Subscriptions.findByUserId(uid, { projection: { rid: 1 } }).toArray()).map((sub) => sub.rid);

	await Rooms.removeUserFromE2EEQueue(subscribedRoomIds, uid);

	await Rooms.addUserIdToE2EEQueue(subscribedRoomIds, uid);
};

export async function resetUserE2EEncriptionKey(uid: string, notifyUser: boolean): Promise<boolean> {
	if (notifyUser) {
		await sendResetNotification(uid);
	}

	const isUserFederated = await isUserIdFederated(uid);
	if (isUserFederated) {
		throw new Meteor.Error('error-not-allowed', 'Federated Users cant have TOTP', { function: 'resetTOTP' });
	}

	await Users.resetE2EKey(uid);
	await Subscriptions.resetUserE2EKey(uid);

	// Add user to room waiting queue
	await addUserToE2EKeysWaitingQueue(uid);

	// Force the user to logout, so that the keys can be generated again
	await Users.unsetLoginTokens(uid);

	return true;
}
