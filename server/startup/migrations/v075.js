import { ServiceConfiguration } from 'meteor/service-configuration';

import { Migrations } from '../../../app/migrations';

Migrations.add({
	version: 71.1,
	up() {
		ServiceConfiguration.configurations.remove({});
	},
});

Migrations.add({
	version: 75,
	up() {
		ServiceConfiguration.configurations.remove({});
	},
});
