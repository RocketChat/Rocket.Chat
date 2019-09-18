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
	});
});
