import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(function() {
	settings.addGroup('Mumble VoiceChat', function() {
		this.add('Mumble_enabled', false, {
			type: 'boolean',
			public: true,
			alert: 'This feature is currently in beta! Please report bugs to github.com/RocketChat/Rocket.Chat/issues',
		});

		this.add('Mumble_server_url', '', { type: 'string', public: false, enableQuery: { _id: 'Broadcasting_enabled', value: true } });
	});
});
