import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings, settingsRegistry } from '../../settings/server';

settingsRegistry.addGroup('OAuth', function() {
	this.section('Apple', function() {
		this.add('Accounts_OAuth_Apple', false, { type: 'boolean', public: true });
	});
});


settings.watch('Accounts_OAuth_Apple', (enabled) => {
	if (!enabled) {
		return ServiceConfiguration.configurations.remove({
			service: 'apple',
		});
	}

	ServiceConfiguration.configurations.upsert({
		service: 'apple',
	}, {
		$set: {
			// We'll hide this button on Web Client
			showButton: false,
			enabled: settings.get('Accounts_OAuth_Apple'),
		},
	});
});
