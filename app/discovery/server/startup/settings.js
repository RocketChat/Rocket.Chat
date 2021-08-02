import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings';

Meteor.startup(() => {
	settings.addGroup('Discovery', function() {
		this.add('Discovery_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			i18nDescription: 'Discovery_Enabled',
			public: true,
		});
		this.add('Discovery_Tags', '', {
			type: 'string',
			i18nLabel: 'Discovery_Tags',
			i18nDescription: 'Discovery_Tags_Description',
			enableQuery: {
				_id: 'Discovery_Enabled',
				value: true,
			},
			public: true,
		});
	});
});
