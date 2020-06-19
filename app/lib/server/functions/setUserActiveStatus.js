import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';

import * as Mailer from '../../../mailer';
import { Users, Subscriptions } from '../../../models';
import { settings } from '../../../settings';
import { relinquishRoomOwnerships } from './relinquishRoomOwnerships';
import { shouldRemoveOrChangeOwner, getSubscribedRoomsForUserWithDetails } from './getRoomsWithSingleOwner';
import { getUserSingleOwnedRooms } from './getUserSingleOwnedRooms';

export function setUserActiveStatus(userId, active, confirmRelinquish = false) {
	check(userId, String);
	check(active, Boolean);

	const user = Users.findOneById(userId);

	if (!user) {
		return false;
	}

	// Users without username can't do anything, so there is no need to check for owned rooms
	if (user.username != null && !active) {
		const subscribedRooms = getSubscribedRoomsForUserWithDetails(userId);

		if (shouldRemoveOrChangeOwner(subscribedRooms) && !confirmRelinquish) {
			const rooms = getUserSingleOwnedRooms(subscribedRooms);
			throw new Meteor.Error('user-last-owner', '', rooms);
		}

		relinquishRoomOwnerships(user._id, subscribedRooms, false);
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
