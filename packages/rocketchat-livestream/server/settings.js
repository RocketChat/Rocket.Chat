Meteor.startup(function() {
	RocketChat.settings.addGroup('LiveStream', function() {
		this.add('Livestream_enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			public: true,
			alert: 'This feature is currently in beta! Please report bugs to github.com/RocketChat/Rocket.Chat/issues'
		});
	});
});
