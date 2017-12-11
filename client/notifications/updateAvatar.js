/* globals updateAvatarOfUsername */

Meteor.startup(function() {
	RocketChat.Notifications.onLogged('updateAvatar', function(data) {
		updateAvatarOfUsername(data.username);
	});
});
