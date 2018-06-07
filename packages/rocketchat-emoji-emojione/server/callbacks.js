/* globals emojione */
Meteor.startup(function() {
	RocketChat.callbacks.add('beforeSendMessageNotifications', (message) => {
		return emojione.shortnameToUnicode(message);
	});
});
