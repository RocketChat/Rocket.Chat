import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings, SettingsVersion4 } from '../../settings/server';

settings.addGroup('OAuth', function() {
	this.section('Apple', function() {
		this.add('Accounts_OAuth_Apple', false, { type: 'boolean', public: true });
	});
});

const configureService = _.debounce(Meteor.bindEnvironment((enabled) => {
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
			enabled: SettingsVersion4.get('Accounts_OAuth_Apple'),
		},
	});
}), 1000);

Meteor.startup(() => {
	SettingsVersion4.watch('Accounts_OAuth_Apple', configureService);
});
