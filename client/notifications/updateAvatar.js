import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../app/notifications';

Meteor.startup(function() {
	Notifications.onLogged('updateAvatar', function(data) {
		const { username, etag } = data;
		Meteor.users.update({ username }, { $set: { avatarETag: etag } });
	});
});
