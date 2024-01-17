import type { IMessage, IPushNotificationConfig, IRoom, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { RocketChatAssets } from '../../../assets/server';
import { replaceMentionedUsernamesWithFullNames, parseMessageTextPerUser } from '../../../lib/server/functions/notifications';
import { getPushData } from '../../../lib/server/functions/notifications/mobile';
import { metrics } from '../../../metrics/server';
import { Push } from '../../../push/server';
import { settings } from '../../../settings/server';

type PushNotificationData = {
	rid: string;
	uid: string;
	mid: string;
	roomName: string;
	username: string;
	message: string;
	payload: Record<string, any>;
	badge: number;
	category: string;
};

type GetNotificationConfigParam = PushNotificationData & {
	idOnly: boolean;
};

type NotificationPayload = {
	message: IMessage;
	notification: IPushNotificationConfig;
};

function hash(str: string): number {
	let hash = 0;
	let i = str.length;

	while (i) {
		hash = (hash << 5) - hash + str.charCodeAt(--i);
		hash &= hash; // Convert to 32bit integer
	}
	return hash;
}

class PushNotification {
	getNotificationId(roomId: string): number {
		const serverId = settings.get('uniqueID');
		return hash(`${serverId}|${roomId}`); // hash
	}

	private getNotificationConfig({
		rid,
		uid: userId,
		mid: messageId,
		roomName,
		username,
		message,
		payload,
		badge = 1,
		category,
		idOnly = false,
	}: GetNotificationConfigParam): IPushNotificationConfig {
		const title = idOnly ? '' : roomName || username;

		// message is being redacted already by 'getPushData' if idOnly is true
		const text = !idOnly && roomName !== '' ? `${username}: ${message}` : message;

		return {
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
				...(!idOnly && { rid, ...payload }),
			},
			userId,
			notId: this.getNotificationId(rid),
			gcm: {
				style: 'inbox',
				image: RocketChatAssets.getURL('Assets_favicon_192'),
			},
			...(category !== '' ? { apn: { category } } : {}),
		};
	}

	async send({ rid, uid, mid, roomName, username, message, payload, badge = 1, category }: PushNotificationData): Promise<void> {
		const idOnly = settings.get<boolean>('Push_request_content_from_server');
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
		await Push.send(config);
	}

	async getNotificationForMessageId({
		receiver,
		message,
		room,
	}: {
		receiver: IUser;
		message: IMessage;
		room: IRoom;
	}): Promise<NotificationPayload> {
		const sender = await Users.findOneById(message.u._id, { projection: { username: 1, name: 1 } });
		if (!sender) {
			throw new Error('Message sender not found');
		}

		let notificationMessage = await callbacks.run('beforeSendMessageNotifications', message.msg);
		if (message.mentions && Object.keys(message.mentions).length > 0 && settings.get('UI_Use_Real_Name')) {
			notificationMessage = replaceMentionedUsernamesWithFullNames(message.msg, message.mentions);
		}
		notificationMessage = await parseMessageTextPerUser(notificationMessage, message, receiver);

		const pushData = await getPushData({
			room,
			message,
			userId: receiver._id,
			receiver,
			senderUsername: sender.username,
			senderName: sender.name,
			notificationMessage,
			shouldOmitMessage: false,
		});

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
