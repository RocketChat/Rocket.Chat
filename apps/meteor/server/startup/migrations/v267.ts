import { Settings } from '@rocket.chat/models';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 267,
	async up() {
		await ServiceConfiguration.configurations.removeAsync({
			service: 'blockstack',
		});

		await Settings.deleteMany({
			_id: {
				$in: [
					'Blockstack',
					'Blockstack_Enable',
					'Blockstack_Auth_Description',
					'Blockstack_ButtonLabelText',
					'Blockstack_Generate_Username',
				],
			},
		});
	},
});
