Meteor.startup(function() {
	RocketChat.settings.add('AutoTranslate_GoogleAPIKey', '', { type: 'string', group: 'Message', section: 'AutoTranslate' });
});
