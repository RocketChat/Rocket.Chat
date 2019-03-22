import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';

Meteor.startup(() => {
	settings.addGroup('Threads', function() {
		settings.add('Threads_enabled', true, {
			type: 'boolean',
			public: true,
			i18nLabel: 'Enabled',
			i18nDescription: 'Threads_enabled_Description',
		});

	});
});
