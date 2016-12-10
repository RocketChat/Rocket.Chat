/* globals updateAvatarOfUsername */

Meteor.startup(function() {
	RocketChat.Notifications.onAll('updateAvatar', function(data) {
		updateAvatarOfUsername(data.username);
	});
});
