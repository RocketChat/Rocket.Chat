import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../../app/notifications/client';

Meteor.startup(() => {
	Notifications.onLogged('updateAvatar', (data) => {
		if ('username' in data) {
			const { username, etag } = data;
			username && Meteor.users.update({ username }, { $set: { avatarETag: etag } });
		}
	});
});
