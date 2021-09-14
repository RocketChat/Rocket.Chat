import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { messageContainsHighlight } from '../../../app/lib/messageContainsHighlight';
import {
	CachedChatSubscription,
	ChatSubscription,
	ChatRoom,
	CachedChatRoom,
} from '../../../app/models/client';
import { Notifications } from '../../../app/notifications/client/lib/Notifications';
import { settings } from '../../../app/settings/client';
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
	const openedRoomId =
		['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && Session.get('openedRoom');

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
		const uid = Meteor.userId();
		if (!uid) {
			return;
		}

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

		const highlights = getUserPreference(Meteor.userId(), 'highlights');
		const desktopNotifications = getUserPreference(Meteor.userId(), 'desktopNotifications') as
			| 'all'
			| 'mentions'
			| 'nothing'
			| undefined;
		const notificationMaxRoomMembers = settings.get('Notifications_Max_Room_Members');

		CachedChatRoom.on('change', ([room, oldRecord]) => {
			const currentMsg = room.lastMessage;
			if (!currentMsg) {
				return;
			}

			const lastMessage = oldRecord?.lastMessage;
			console.log(currentMsg, lastMessage);
			if (lastMessage && currentMsg?.ts.getTime() <= lastMessage?.ts?.getTime()) {
				return;
			}

			const sub = ChatSubscription.findOne({ rid: room._id });
			if (!sub) {
				return;
			}

			const disableAllMessageNotifications = room.usersCount >= notificationMaxRoomMembers;

			const hasMentionToUser = currentMsg.mentions?.map(({ _id }) => _id).includes(uid);

			const isHighlighted = messageContainsHighlight(currentMsg.msg, highlights);

			// TODO convert RoomTypeConfig to be able to use it on client side and avoid duplicated logic below to define 'title' and 'text'
			const roomName = `${room.t !== 'd' && room.t !== 'l' ? '#' : ''}${sub.fname || sub.name}`;
			const title = room.t === 'l' ? `[Omnichannel] ${roomName}` : roomName;
			const text = `${
				room.t !== 'd' || room.uids.length > 2
					? `${currentMsg.u.name || currentMsg.u.username}: `
					: ''
			}${currentMsg.msg}`;

			const { _id, rid, tmid, u: sender, msg, t } = currentMsg;

			if (
				disableAllMessageNotifications &&
				desktopNotifications == null &&
				!isHighlighted &&
				!hasMentionToUser
				// !hasReplyToThread
			) {
				return;
			}

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
			showDesktopNotification({
				title,
				text,
				payload: {
					_id,
					rid,
					tmid,
					sender,
					name: room.name,
					type: room.t,
					message: {
						msg,
						t,
					},
				},
			});
		});
	});
});
