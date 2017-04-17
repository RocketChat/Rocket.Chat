/* globals Push */
class PushNotification {
	getNotificationId(roomId) {
		const serverId = RocketChat.settings.get('uniqueID');
		return this.hash(`${ serverId }|${ roomId }`); // hash
	}

	hash(str) {
		let hash = 0;
		let i = str.length;

		while (i) {
			hash = ((hash << 5) - hash) + str.charCodeAt(--i);
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}

	send({ roomName, roomId, username, message, usersTo, payload }) {
		let title;
		if (roomName && roomName !== '') {
			title = `${ roomName }`;
			message = `${ username }: ${ message }`;
		} else {
			title = `${ username }`;
		}
		const icon = RocketChat.settings.get('Assets_favicon_192').url || RocketChat.settings.get('Assets_favicon_192').defaultUrl;
		const config = {
			from: 'push',
			badge: 1,
			sound: 'default',
			title,
			text: message,
			payload,
			query: usersTo,
			notId: this.getNotificationId(roomId),
			gcm: {
				style: 'inbox',
				summaryText: '%n% new messages',
				image: RocketChat.getURL(icon, { full: true })
			},
			apn: {
				text: title + ((title !== '' && message !== '') ? '\n' : '') + message
			}
		};

		return Push.send(config);
	}
}

RocketChat.PushNotification = new PushNotification();
