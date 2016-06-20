Meteor.startup(function() {
	RocketChat.settings.addGroup('Video Conference', function() {
		this.add('Jitsi_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			alert: 'This Feature is currently in beta! Please report bugs to github.com/RocketChat/Rocket.Chat/issues',
			public: true
		});

		this.add('Jitsi_Domain', 'meet.jit.si', {
			type: 'string',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true
			},
			i18nLabel: 'Domain',
			public: true
		});

		this.add('Jitsi_SSL', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true
			},
			i18nLabel: 'SSL',
			public: true
		});

		this.add('Jitsi_Enable_Channels', false, {
			type: 'boolean',
			enableQuery: {
				_id: 'Jitsi_Enabled',
				value: true
			},
			i18nLabel: 'Jitsi_Enable_Channels',
			public: true
		});
	});
});
