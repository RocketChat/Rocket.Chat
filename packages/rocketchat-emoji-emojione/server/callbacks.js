/* globals emojione */
Meteor.startup(function() {
	RocketChat.callbacks.add('beforeNotifyUser', (message) => {
		return emojione.shortnameToUnicode(message);
	});
});
