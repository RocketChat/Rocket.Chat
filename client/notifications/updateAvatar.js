import { Meteor } from 'meteor/meteor';
import { updateAvatarOfUsername } from 'meteor/rocketchat:ui';

Meteor.startup(function() {
	RocketChat.Notifications.onLogged('updateAvatar', function(data) {
		updateAvatarOfUsername(data.username);
	});
});
