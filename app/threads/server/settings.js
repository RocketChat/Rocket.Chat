import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(() => {
	settings.addGroup('Threads', function() {
		this.add('Threads_enabled', true, {
			group: 'Threads',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
		});
		this.add('Send_to_channel_default', true, {
			group: 'Threads',
			i18nLabel: 'Also_send_to_channel_default',
			type: 'boolean',
			public: true,
		});
	});
});
