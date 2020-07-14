import { Meteor } from 'meteor/meteor';

import { Push } from '../../../push/server';
import { settings } from '../../../settings/server';
import { metrics } from '../../../metrics/server';
import { Messages, Rooms, Users } from '../../../models/server';
import { RocketChatAssets } from '../../../assets/server';
import { replaceMentionedUsernamesWithFullNames, parseMessageTextPerUser } from '../../../lib/server/functions/notifications';
import { callbacks } from '../../../callbacks/server';
import { getPushData } from '../../../lib/server/functions/notifications/mobile';

export class PushNotification {
	getNotificationId(roomId) {
		const serverId = settings.get('uniqueID');
		return this.hash(`${ serverId }|${ roomId }`); // hash
	}

	getNotificationConfig({ rid, uid: userId, mid: messageId, roomName, username, message, payload, badge = 1, category, idOnly = false }) {
		let title;
		if (roomName && roomName !== '') {
			title = `${ roomName }`;
			message = `${ username }: ${ message }`;
		} else {
			title = `${ username }`;
		}

		const config = {
			from: 'push',
			badge,
			sound: 'default',
			priority: 10,
			title,
			text: message,
			payload: {
				host: Meteor.absoluteUrl(),
				rid,
				messageId,
				notificationType: idOnly ? 'message-id-only' : 'message',
				...idOnly ? { } : payload,
			},
			userId,
			notId: this.getNotificationId(rid),
			gcm: {
				style: 'inbox',
				image: RocketChatAssets.getURL('Assets_favicon_192'),
			},
		};

		if (category !== '') {
			config.apn = {
				category,
			};
		}

		return config;
	}

	hash(str) {
		let hash = 0;
		let i = str.length;

		while (i) {
			hash = ((hash << 5) - hash) + str.charCodeAt(--i);
			hash &= hash; // Convert to 32bit integer
		}
		return hash;
	}

	send({ rid, uid, mid, roomName, username, message, payload, badge = 1, category }) {
		const idOnly = settings.get('Push_request_content_from_server');
		const config = this.getNotificationConfig({ rid, uid, mid, roomName, username, message, payload, badge, category, idOnly });

		metrics.notificationsSent.inc({ notification_type: 'mobile' });
		return Push.send(config);
	}

	getNotificationForMessageId(messageId, receiverUserId) {
		const message = Messages.findOneById(messageId);
		if (!message) {
			throw new Error('Message not found');
		}

		const receiver = Users.findOne(receiverUserId);
		if (!receiver) {
			throw new Error('User not found');
		}

		const sender = Users.findOne(message.u._id, { fields: { username: 1, name: 1 } });
		if (!sender) {
			throw new Error('Message sender not found');
		}

		let notificationMessage = callbacks.run('beforeSendMessageNotifications', message.msg);
		if (message.mentions?.length > 0 && settings.get('UI_Use_Real_Name')) {
			notificationMessage = replaceMentionedUsernamesWithFullNames(message.msg, message.mentions);
		}
		notificationMessage = parseMessageTextPerUser(notificationMessage, message, receiver);

		const room = Rooms.findOneById(message.rid);
		const pushData = Promise.await(getPushData({
			room,
			message,
			userId: receiverUserId,
			receiverUsername: receiver.username,
			senderUsername: sender.username,
			senderName: sender.name,
			notificationMessage,
		}));

		return {
			message,
			notification: this.getNotificationConfig({
				...pushData,
				rid: message.rid,
				uid: message.u._id,
				mid: messageId,
				idOnly: false,
			}),
		};
	}
}

export default new PushNotification();
