import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { getUserAvatarURL } from '../../../utils/lib/getUserAvatarURL';

Meteor.startup(function() {
	window.addEventListener('message', async ({ data, source }) => {
		if (!data.hasOwnProperty('rcEmbeddedSDK')) {
			return;
		}

		try {
			const { action, id } = data.rcEmbeddedSDK;

			switch (action) {
				case 'getUserInfo':
					const baseUrl = window.location.origin;
					const { username, _id } = Meteor.user();
					const avatarUrl = `${ baseUrl }${ getUserAvatarURL(username) }`;
					source.postMessage({
						rcEmbeddedSDK: {
							action,
							id,
							payload: {
								userId: _id,
								username,
								avatarUrl,
							},
						},
					}, '*');
					break;
				case 'getRoomInfo':
					const { name: roomName, _id: roomId } = Session.get(`roomData${ Session.get('openedRoom') }`);
					source.postMessage({
						rcEmbeddedSDK: {
							action,
							id,
							payload: {
								roomId,
								roomName,
							},
						},
					}, '*');
					break;
				default:
					break;
			}
		} catch (err) {
			console.error(err);
		}
	}, false);
});
