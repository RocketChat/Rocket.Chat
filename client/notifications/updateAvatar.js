import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../app/notifications';

Meteor.startup(function() {
	Notifications.onLogged('updateAvatar', function(data) {
		const { username, etag } = data;
		username && Meteor.users.update({ username }, { $set: { avatarETag: etag } });
	});
});
