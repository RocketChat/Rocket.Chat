import { MongoInternals } from 'meteor/mongo';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 270,
	async up() {
		const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
		const settings = mongo.db.collection('rocketchat_settings');
		await settings.deleteMany({
			_id: {
				$in: ['VoIP_Server_Host', 'VoIP_Server_Websocket_Port'],
			},
		});
	},
});
