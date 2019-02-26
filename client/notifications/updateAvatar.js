import { Meteor } from 'meteor/meteor';
import { updateAvatarOfUsername } from 'meteor/rocketchat:ui-utils';
import { Notifications } from 'meteor/rocketchat:notifications';

Meteor.startup(function() {
	Notifications.onLogged('updateAvatar', function(data) {
		updateAvatarOfUsername(data.username);
	});
});
