Meteor.startup(function() {
	RocketChat.settings.addGroup('Jitsi', function() {
		this.add('Jitsi_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
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
	});
});
