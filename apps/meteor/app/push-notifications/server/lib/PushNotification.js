import { Meteor } from 'meteor/meteor';

import { Push } from '../../../push/server';
import { settings } from '../../../settings/server';
import { metrics } from '../../../metrics/server';
import { Users } from '../../../models/server';
import { RocketChatAssets } from '../../../assets/server';
import { replaceMentionedUsernamesWithFullNames, parseMessageTextPerUser } from '../../../lib/server/functions/notifications';
import { callbacks } from '../../../../lib/callbacks';
import { getPushData } from '../../../lib/server/functions/notifications/mobile';

export class PushNotification {
	getNotificationId(roomId) {
		const serverId = settings.get('uniqueID');
		return this.hash(`${serverId}|${roomId}`); // hash
	}

	getNotificationConfig({ rid, uid: userId, mid: messageId, roomName, username, message, payload, badge = 1, category, idOnly = false }) {
		const title = idOnly ? '' : roomName || username;

		// message is being redacted already by 'getPushData' if idOnly is true
		const text = !idOnly && roomName !== '' ? `${username}: ${message}` : message;

		const config = {
			from: 'push',
			badge,
			sound: 'default',
			priority: 10,
			title,
			text,
			payload: {
				host: Meteor.absoluteUrl(),
				messageId,
				notificationType: idOnly ? 'message-id-only' : 'message',
				...(idOnly || { rid, ...payload }),
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
			hash = (hash << 5) - hash + str.charCodeAt(--i);
			hash &= hash; // Convert to 32bit integer
		}
		return hash;
	}

	send({ rid, uid, mid, roomName, username, message, payload, badge = 1, category }) {
		const idOnly = settings.get('Push_request_content_from_server');
		const config = this.getNotificationConfig({
			rid,
			uid,
			mid,
			roomName,
			username,
			message,
			payload,
			badge,
			category,
			idOnly,
		});

		metrics.notificationsSent.inc({ notification_type: 'mobile' });
		return Push.send(config);
	}

	getNotificationForMessageId({ receiver, message, room }) {
		const sender = Users.findOne(message.u._id, { fields: { username: 1, name: 1 } });
		if (!sender) {
			throw new Error('Message sender not found');
		}

		let notificationMessage = callbacks.run('beforeSendMessageNotifications', message.msg);
		if (message.mentions?.length > 0 && settings.get('UI_Use_Real_Name')) {
			notificationMessage = replaceMentionedUsernamesWithFullNames(message.msg, message.mentions);
		}
		notificationMessage = parseMessageTextPerUser(notificationMessage, message, receiver);

		const pushData = Promise.await(
			getPushData({
				room,
				message,
				userId: receiver._id,
				receiver,
				senderUsername: sender.username,
				senderName: sender.name,
				notificationMessage,
				shouldOmitMessage: false,
			}),
		);

		return {
			message,
			notification: this.getNotificationConfig({
				...pushData,
				rid: message.rid,
				uid: message.u._id,
				mid: message._id,
				idOnly: false,
			}),
		};
	}
}

export default new PushNotification();
