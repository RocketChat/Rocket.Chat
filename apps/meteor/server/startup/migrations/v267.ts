import { MongoInternals } from 'meteor/mongo';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 267,
	async up() {
		ServiceConfiguration.configurations.remove({
			service: 'blockstack',
		});

		const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
		const settings = mongo.db.collection('rocketchat_settings');
		await settings.deleteMany({
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
