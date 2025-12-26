import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 334,
	name: 'Remove webRTC settings',
	async up() {
		await Settings.deleteMany({
			_id: {
				$in: [
					'WebRTC_Enabled',
					'WebRTC_Enable_Channel',
					'WebRTC_Enable_Private',
					'WebRTC_Enable_Direct',
					'WebRTC_Calls_Count',
					'WebRTC_Servers',
				],
			},
		});
	},
});
