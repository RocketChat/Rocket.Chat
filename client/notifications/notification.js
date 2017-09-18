/* globals KonchatNotification, fireGlobalEvent, readMessage, CachedChatSubscription */

// Show notifications and play a sound for new messages.
// We trust the server to only send notifications for interesting messages, e.g. direct messages or
// group messages in which the user is mentioned.

function notifyNewRoom(sub) {

	// Do not play new room sound if user is busy
	if (Session.equals(`user_${ Meteor.userId() }_status`, 'busy')) {
		return;
	}

	if ((!FlowRouter.getParam('name') || FlowRouter.getParam('name') !== sub.name) && !sub.ls && sub.alert === true) {
		return KonchatNotification.newRoom(sub.rid);
	}
}

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.userId()) {
			RocketChat.Notifications.onUser('notification', function(notification) {

				let openedRoomId = undefined;
				if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName())) {
					openedRoomId = Session.get('openedRoom');
				}

				// This logic is duplicated in /client/startup/unread.coffee.
				const hasFocus = readMessage.isEnable();
				const messageIsInOpenedRoom = openedRoomId === notification.payload.rid;

				fireGlobalEvent('notification', {
					notification,
					fromOpenedRoom: messageIsInOpenedRoom,
					hasFocus
				});

				if (RocketChat.Layout.isEmbedded()) {
					if (!hasFocus && messageIsInOpenedRoom) {
						// Play a sound and show a notification.
						KonchatNotification.newMessage(notification.payload.rid);
						KonchatNotification.showDesktop(notification);
					}
				} else if (!(hasFocus && messageIsInOpenedRoom)) {
					// Play a sound and show a notification.
					KonchatNotification.newMessage(notification.payload.rid);
					KonchatNotification.showDesktop(notification);
				}
			});

			RocketChat.Notifications.onUser('audioNotification', function(notification) {

				const openedRoomId = Session.get('openedRoom');

				// This logic is duplicated in /client/startup/unread.coffee.
				const hasFocus = readMessage.isEnable();
				const messageIsInOpenedRoom = openedRoomId === notification.payload.rid;

				if (RocketChat.Layout.isEmbedded()) {
					if (!hasFocus && messageIsInOpenedRoom) {
						// Play a sound and show a notification.
						KonchatNotification.newMessage(notification.payload.rid);
					}
				} else if (!(hasFocus && messageIsInOpenedRoom)) {
					// Play a sound and show a notification.
					KonchatNotification.newMessage(notification.payload.rid);
				}
			});

			CachedChatSubscription.onSyncData = function(action, sub) {
				if (action !== 'removed') {
					notifyNewRoom(sub);
				}
			};

			RocketChat.Notifications.onUser('subscriptions-changed', (action, sub) => {
				notifyNewRoom(sub);
			});
		}
	});
});
