import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { settings } from '../../settings';

settings.addGroup('OAuth', function() {
	this.section('Apple', function() {
		this.add('Accounts_OAuth_Apple', false, { type: 'boolean', public: true });
	});
});

const configureService = _.debounce(Meteor.bindEnvironment(() => {
	if (!settings.get('Accounts_OAuth_Apple')) {
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
}), 1000);

Meteor.startup(() => {
	settings.get('Accounts_OAuth_Apple', () => {
		configureService();
	});
});
