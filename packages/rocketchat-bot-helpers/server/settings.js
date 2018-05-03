Meteor.startup(function() {
	RocketChat.settings.addGroup('Bots', function() {
		this.add('BotHelpers_userFields', '_id, name, username, emails, language, utcOffset', {
			type: 'string',
			section: 'Helpers',
			i18nLabel: 'BotHelpers_userFields',
			i18nDescription: 'BotHelpers_userFields_Description'
		});
	});
});
