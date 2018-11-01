/* globals updateAvatarOfUsername */
import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
	RocketChat.Notifications.onLogged('updateAvatar', function(data) {
		updateAvatarOfUsername(data.username);
	});
});
