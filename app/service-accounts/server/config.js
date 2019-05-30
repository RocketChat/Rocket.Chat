import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(() => {
	settings.addGroup('Service Accounts', function() {
		this.add('Service_account_enabled', true, {
			group: 'Service Accounts',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
		});
		this.add('Service_account_limit', 3, {
			type: 'int',
			public: true,
		});
	});
});
