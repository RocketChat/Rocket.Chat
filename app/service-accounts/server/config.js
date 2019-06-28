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
		this.add('Service_Accounts_SearchFields', 'username, name, description', {
			type: 'string',
			public: true,
		});
	});
	settings.add('Accounts_Default_User_Preferences_sidebarShowServiceAccounts', true, {
		group: 'Accounts',
		section: 'Accounts_Default_User_Preferences',
		type: 'boolean',
		public: true,
		i18nLabel: 'Group_subscriptions',
	});
});
