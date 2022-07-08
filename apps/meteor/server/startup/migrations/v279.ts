import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 279,
	async up() {
		await Settings.deleteMany({
			_id: {
				$in: ['WebRTC_Enable_Channel', 'WebRTC_Enable_Private', 'WebRTC_Enable_Direct'],
			},
		});
	},
});

// Omnichannel_call_provider
