import { addMigration } from '../../lib/migrations';
import { Settings as RawSettings } from '../../../app/models/server/raw';

// Removes unused VoIP settings
addMigration({
	version: 270,
	async up() {
		await RawSettings.deleteMany({
			_id: {
				$in: ['VoIP_Server_Name', 'VoIP_Server_Host', 'VoIP_Server_Websocket_Path', 'VoIP_Server_Websocket_Port'],
			},
		});
	},
});
