/* globals emojione */
Meteor.startup(function() {
	RocketChat.callbacks.add('beforeSendMessageNotifications', (message) => emojione.shortnameToUnicode(message));
});
