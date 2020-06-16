import { Meteor } from 'meteor/meteor';

import { Push } from '../../../push/server';
import { settings } from '../../../settings/server';
import { metrics } from '../../../metrics/server';
import { RocketChatAssets } from '../../../assets/server';

export class PushNotification {
	getNotificationId(roomId) {
		const serverId = settings.get('uniqueID');
		return this.hash(`${ serverId }|${ roomId }`); // hash
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

	send({ rid, uid: userId, mid: messageId, roomName, username, message, payload, badge = 1, category }) {
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
				...payload,
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

		metrics.notificationsSent.inc({ notification_type: 'mobile' });
		return Push.send(config);
	}
}

export default new PushNotification();
