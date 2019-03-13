import { Meteor } from 'meteor/meteor';
import { updateAvatarOfUsername } from '/app/ui-utils';
import { Notifications } from '/app/notifications';

Meteor.startup(function() {
	Notifications.onLogged('updateAvatar', function(data) {
		updateAvatarOfUsername(data.username);
	});
});
