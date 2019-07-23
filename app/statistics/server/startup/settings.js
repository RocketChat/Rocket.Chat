import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings';

Meteor.startup(function() {
	settings.add('Usage_Statistics_Enabled', false, {
		type: 'boolean',
		group: 'Analytics',
		section: 'Analytics_features_enabled',
		public: true,
		i18nDescription: 'Usage_Statistics_Enabled_description',
	});
});
