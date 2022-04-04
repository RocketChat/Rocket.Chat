import { Meteor } from 'meteor/meteor';

import { settingsRegistry } from '../../settings/server';

Meteor.startup(function () {
	settingsRegistry.addGroup('Accounts', function () {
		this.section('Iframe', function () {
			this.add('Accounts_iframe_enabled', false, { type: 'boolean', public: true });
			this.add('Accounts_iframe_url', '', { type: 'string', public: true });
			this.add('Accounts_Iframe_api_url', '', { type: 'string', public: true });
			this.add('Accounts_Iframe_api_method', 'POST', { type: 'string', public: true });
		});
	});
});
