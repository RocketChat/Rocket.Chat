import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 272,
	async up() {
		await Settings.deleteMany({
			_id: {
				$in: ['VoIP_Server_Host', 'VoIP_Server_Websocket_Port'],
			},
		});
	},
});
