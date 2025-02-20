import type { ISubscription } from '@rocket.chat/core-typings';
import { manageFavicon } from '@rocket.chat/favicon';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { Subscriptions, Rooms } from '../../app/models/client';
import { getUserPreference } from '../../app/utils/client';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';

const fetchSubscriptions = (): ISubscription[] =>
	Subscriptions.find(
		{
			open: true,
			hideUnreadStatus: { $ne: true },
			archived: { $ne: true },
		},
		{
			fields: {
				unread: 1,
				alert: 1,
				rid: 1,
				t: 1,
				name: 1,
				ls: 1,
				unreadAlert: 1,
				fname: 1,
				prid: 1,
			},
		},
	).fetch();

Meteor.startup(() => {
	Tracker.autorun(() => {
		const userUnreadAlert = getUserPreference(Meteor.userId(), 'unreadAlert');

		let unreadAlert: false | '•' = false;

		const unreadCount = fetchSubscriptions().reduce(
			(ret, subscription) =>
				Tracker.nonreactive(() => {
					const room = Rooms.findOne({ _id: subscription.rid }, { fields: { usersCount: 1 } });
					fireGlobalEvent('unread-changed-by-subscription', {
						...subscription,
						usersCount: room?.usersCount,
					});

					if (subscription.alert || subscription.unread > 0) {
						// Increment the total unread count.
						if (subscription.alert === true && subscription.unreadAlert !== 'nothing') {
							if (subscription.unreadAlert === 'all' || userUnreadAlert !== false) {
								unreadAlert = '•';
							}
						}
						return ret + subscription.unread;
					}
					return ret;
				}),
			0,
		);

		if (unreadCount > 0) {
			if (unreadCount > 999) {
				Session.set('unread', '999+');
			} else {
				Session.set('unread', unreadCount);
			}
		} else if (unreadAlert !== false) {
			Session.set('unread', unreadAlert);
		} else {
			Session.set('unread', '');
		}
	});
});

Meteor.startup(() => {
	const updateFavicon = manageFavicon();

	Tracker.autorun(() => {
		const unread = Session.get('unread');
		fireGlobalEvent('unread-changed', unread);

		updateFavicon(unread);
	});
});
