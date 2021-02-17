import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';

import { Favico } from '../../app/favico';
import { ChatSubscription, ChatRoom } from '../../app/models/client';
import { menu, fireGlobalEvent } from '../../app/ui-utils';
import { getUserPreference } from '../../app/utils';
import { settings } from '../../app/settings';

const fetchSubscriptions = () => ChatSubscription.find({
	open: true,
	hideUnreadStatus: { $ne: true },
}, {
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
}).fetch();

Meteor.startup(() => {
	Tracker.autorun(() => {
		const userUnreadAlert = getUserPreference(Meteor.userId(), 'unreadAlert');

		let unreadAlert = false;

		const unreadCount = fetchSubscriptions().reduce((ret, subscription) =>
			Tracker.nonreactive(() => {
				const room = ChatRoom.findOne({ _id: subscription.rid }, { fields: { usersCount: 1 } });
				fireGlobalEvent('unread-changed-by-subscription', { ...subscription, usersCount: room && room.usersCount });

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
			}), 0);

		menu.updateUnreadBars();

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
	const favicon = new Favico({
		position: 'up',
		animation: 'none',
	});

	window.favico = favicon;

	Tracker.autorun(function() {
		const siteName = settings.get('Site_Name') || '';

		const unread = Session.get('unread');
		fireGlobalEvent('unread-changed', unread);

		if (favicon) {
			favicon.badge(unread, {
				bgColor: typeof unread !== 'number' ? '#3d8a3a' : '#ac1b1b',
			});
		}

		document.title = unread === '' ? siteName : `(${ unread }) ${ siteName }`;
	});
});
