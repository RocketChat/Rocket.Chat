import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 279,
	async up() {
		const omnichannelProvider = await Settings.getValueById('Omnichannel_call_provider');

		if (omnichannelProvider === 'WebRTC' && (await Settings.getValueById('WebRTC_Enabled'))) {
			Settings.updateValueById('VideoConf_Default_Provider', 'webrtc');
		}

		if (omnichannelProvider !== 'none') {
			await Settings.updateValueById('VideoConf_Enable_Omnichannel', true);
		}

		await Settings.deleteMany({
			_id: {
				$in: ['WebRTC_Enable_Channel', 'WebRTC_Enable_Private', 'WebRTC_Enable_Direct', 'Omnichannel_call_provider'],
			},
		});
	},
});
