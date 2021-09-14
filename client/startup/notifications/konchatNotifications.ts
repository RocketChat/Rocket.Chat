import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { CachedChatSubscription, ChatSubscription, ChatRoom } from '../../../app/models/client';
import { Notifications } from '../../../app/notifications/client';
import { fireGlobalEvent, readMessage, Layout } from '../../../app/ui-utils/client';
import { KonchatNotification } from '../../../app/ui/client';
import { getUserPreference } from '../../../app/utils/client';
import { IMessage } from '../../../definition/IMessage';
import { IRoom } from '../../../definition/IRoom';
import { ISubscription } from '../../../definition/ISubscription';

const notifyNewRoom = (sub: ISubscription): void => {
	if (Session.equals(`user_${Meteor.userId()}_status`, 'busy')) {
		return;
	}

	if (
		(!FlowRouter.getParam('name') || FlowRouter.getParam('name') !== sub.name) &&
		!sub.ls &&
		sub.alert === true
	) {
		KonchatNotification.newRoom(sub.rid);
	}
};

type NotificationEvent = {
	title: string;
	text: string;
	payload: {
		_id: IMessage['_id'];
		rid: IMessage['rid'];
		tmid?: IMessage['_id'];
		sender?: IMessage['u'];
		type?: IRoom['t'];
		name: IRoom['name'];
		message: {
			msg: IMessage['msg'];
			t?: string;
		};
	};
};

function notifyNewMessageAudio(rid: string): void {
	const openedRoomId = Session.get('openedRoom');

	// This logic is duplicated in /client/startup/unread.coffee.
	const hasFocus = readMessage.isEnable();
	const messageIsInOpenedRoom = openedRoomId === rid;
	const muteFocusedConversations = getUserPreference(Meteor.userId(), 'muteFocusedConversations');

	if (Layout.isEmbedded()) {
		if (!hasFocus && messageIsInOpenedRoom) {
			// Play a notification sound
			KonchatNotification.newMessage(rid);
		}
	} else if (!hasFocus || !messageIsInOpenedRoom || !muteFocusedConversations) {
		// Play a notification sound
		KonchatNotification.newMessage(rid);
	}
}

const showDesktopNotification = (notification: NotificationEvent): void => {
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
		hasFocus,
	});

	if (Layout.isEmbedded()) {
		if (!hasFocus && messageIsInOpenedRoom) {
			// Show a notification.
			KonchatNotification.showDesktop(notification);
		}
	} else if (!hasFocus || !messageIsInOpenedRoom) {
		// Show a notification.
		KonchatNotification.showDesktop(notification);
	}
};

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			return;
		}

		Notifications.onUser('notification', (notification: NotificationEvent) => {
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
				hasFocus,
			});

			if (Layout.isEmbedded()) {
				if (!hasFocus && messageIsInOpenedRoom) {
					// Show a notification.
					KonchatNotification.showDesktop(notification);
				}
			} else if (!hasFocus || !messageIsInOpenedRoom) {
				// Show a notification.
				KonchatNotification.showDesktop(notification);
			}

			notifyNewMessageAudio(notification.payload.rid);
		});

		CachedChatSubscription.onSyncData = ((
			action: 'changed' | 'removed',
			sub: ISubscription,
		): void => {
			if (action !== 'removed') {
				notifyNewRoom(sub);
			}
		}) as () => void;

		Notifications.onUser(
			'subscriptions-changed',
			(_action: 'changed' | 'removed', sub: ISubscription) => {
				notifyNewRoom(sub);
			},
		);

		Notifications.onUser('rooms-changed', (_action: 'changed' | 'removed', room: IRoom) => {
			if (!room.lastMessage?.msg) {
				return;
			}

			console.log('rooms-changed ->', room);

			// notify only on new messages
			const oldRoom = ChatRoom.findOne({ _id: room._id }, { fields: { 'lastMessage.ts': 1 } });
			if (room.lastMessage.ts <= oldRoom.lastMessage.ts) {
				return;
			}

			// TODO validate same behavior as done on server side before
			// export function shouldNotifyDesktop({
			// 	disableAllMessageNotifications,
			// 	status,
			// 	statusConnection,
			// 	desktopNotifications,
			// 	hasMentionToAll,
			// 	hasMentionToHere,
			// 	isHighlighted,
			// 	hasMentionToUser,
			// 	hasReplyToThread,
			// 	roomType,
			// 	isThread,
			// }) {
			// 	if (disableAllMessageNotifications && desktopNotifications == null && !isHighlighted && !hasMentionToUser && !hasReplyToThread) {
			// 		return false;
			// 	}

			// 	if (statusConnection === 'offline' || status === 'busy' || desktopNotifications === 'nothing') {
			// 		return false;
			// 	}

			// 	if (!desktopNotifications) {
			// 		if (settings.get('Accounts_Default_User_Preferences_desktopNotifications') === 'all' && (!isThread || hasReplyToThread)) {
			// 			return true;
			// 		}
			// 		if (settings.get('Accounts_Default_User_Preferences_desktopNotifications') === 'nothing') {
			// 			return false;
			// 		}
			// 	}

			// 	return (roomType === 'd' || (!disableAllMessageNotifications && (hasMentionToAll || hasMentionToHere)) || isHighlighted || desktopNotifications === 'all' || hasMentionToUser) && (!isThread || hasReplyToThread);
			// }

			const { lastMessage: msg } = room;

			// TODO is this the best way to get subscription data?
			const sub = ChatSubscription.findOne({ rid: room._id });

			console.log('sub ->', sub);

			// TODO convert RoomTypeConfig to be able to use it on client side and avoid duplicated logic below to define 'title' and 'text'
			const roomName = `${room.t !== 'd' && room.t !== 'l' ? '#' : ''}${sub.fname || sub.name}`;
			const title = room.t === 'l' ? `[Omnichannel] ${roomName}` : roomName;
			const text = `${
				room.t !== 'd' || room.uids.length > 2 ? `${msg.u.name || msg.u.username}: ` : ''
			}${msg.msg}`;

			showDesktopNotification({
				title,
				text,
				payload: {
					_id: msg._id,
					rid: msg.rid,
					tmid: msg.tmid,
					sender: msg.u,
					type: room.t,
					name: room.name,
					message: {
						msg: msg.msg,
						t: msg.t,
					},
				},
			});
		});
	});
});
