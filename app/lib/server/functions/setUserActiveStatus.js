import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

import * as Mailer from '../../../../server/mailer';
import { Users, Subscriptions } from '../../../models';
import { settings } from '../../../settings';

export function setUserActiveStatus(userId, active) {
	check(userId, String);
	check(active, Boolean);

	const user = Users.findOneById(userId);

	if (!user) {
		return false;
	}

	Users.setUserActive(userId, active);

	if (user.username) {
		Subscriptions.setArchivedByUsername(user.username, !active);
	}

	if (active === false) {
		Users.unsetLoginTokens(userId);
	} else {
		Users.unsetReason(userId);
	}
	if (active && !settings.get('Accounts_Send_Email_When_Activating')) {
		return true;
	}
	if (!active && !settings.get('Accounts_Send_Email_When_Deactivating')) {
		return true;
	}

	const destinations = Array.isArray(user.emails) && user.emails.map((email) => `${ user.name || user.username }<${ email.address }>`);

	const email = {
		to: destinations,
		from: settings.get('From_Email'),
		subject: Accounts.emailTemplates.userActivated.subject({ active }),
		html: Accounts.emailTemplates.userActivated.html({ active, name: user.name, username: user.username }),
	};

	Mailer.sendNoWrap(email);
}
