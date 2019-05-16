import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Favico } from 'meteor/rocketchat:favico';
import { ChatSubscription } from 'meteor/rocketchat:models';
import { RoomManager, menu, fireGlobalEvent, readMessage } from 'meteor/rocketchat:ui-utils';
import { getUserPreference } from 'meteor/rocketchat:utils';
import { settings } from 'meteor/rocketchat:settings';

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
	},
}).fetch();

// TODO: make it a helper
const getOpenRoomId = () => Tracker.nonreactive(() => {
	if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName())) {
		return Session.get('openedRoom');
	}
});

Meteor.startup(() => {
	Tracker.autorun(() => {
		const openedRoomId = getOpenRoomId();

		let unreadCount = 0;
		let unreadCountInOpenedRoom = 0;
		let unreadAlert = false;

		for (const subscription of fetchSubscriptions()) {
			fireGlobalEvent('unread-changed-by-subscription', subscription);

			if (subscription.alert || subscription.unread > 0) {
				const hasFocus = readMessage.isEnable();
				const subscriptionIsTheOpenedRoom = openedRoomId === subscription.rid;
				if (hasFocus && subscriptionIsTheOpenedRoom) {
					// The user has probably read all messages in this room.
					// TODO: readNow() should return whether it has actually marked the room as read.
					setTimeout(() => {
						readMessage.readNow();
					}, 500);
				}

				// Increment the total unread count.
				unreadCount += subscription.unread;
				if (subscriptionIsTheOpenedRoom) {
					unreadCountInOpenedRoom = subscription.unread;
				}
				if (subscription.alert === true && subscription.unreadAlert !== 'nothing') {
					const userUnreadAlert = getUserPreference(Meteor.userId(), 'unreadAlert');
					if (subscription.unreadAlert === 'all' || userUnreadAlert !== false) {
						unreadAlert = '•';
					}
				}
			}

			if (RoomManager.openedRooms[subscription.t + subscription.name]) {
				readMessage.refreshUnreadMark(subscription.rid);
			}
		}

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

		Session.set('unreadOutsideRoom', unreadCount > unreadCountInOpenedRoom);
	});
});

Meteor.startup(() => {
	const favicon = window.favico = new Favico({
		position: 'up',
		animation: 'none',
	});

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
