import { Push } from 'meteor/rocketchat:push';

import { settings } from '../../../settings';
import { metrics } from '../../../metrics';
import { RocketChatAssets } from '../../../assets';

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

	send({ roomName, roomId, username, message, usersTo, payload, badge = 1, category }) {
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
			title,
			text: message,
			payload,
			query: usersTo,
			notId: this.getNotificationId(roomId),
			gcm: {
				style: 'inbox',
				summaryText: '%n% new messages',
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
