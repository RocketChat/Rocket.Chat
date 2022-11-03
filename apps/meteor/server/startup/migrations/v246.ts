import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';
import { settings } from '../../../app/settings/server';

addMigration({
	version: 246,
	up() {
		const livechatVideoCallEnabled = settings.get('Livechat_videocall_enabled');
		if (livechatVideoCallEnabled) {
			Settings.updateOne(
				{ _id: 'Omnichannel_call_provider' },
				{
					$set: { value: 'Jitsi' },
				},
				{ upsert: true },
			);
		}
		Settings.removeById('Livechat_videocall_enabled');

		const webRTCEnableChannel = settings.get('WebRTC_Enable_Channel');
		const webRTCEnableDirect = settings.get('WebRTC_Enable_Direct');
		const webRTCEnablePrivate = settings.get('WebRTC_Enable_Private');
		if (webRTCEnableChannel || webRTCEnableDirect || webRTCEnablePrivate) {
			Settings.updateOne(
				{ _id: 'WebRTC_Enabled' },
				{
					$set: { value: true },
				},
				{ upsert: true },
			);
		}
	},
});
