import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models/server';
import { settings } from '../../../app/settings/server';

Migrations.add({
	version: 236,
	up() {
		const livechatVideoCallEnabled = settings.get('Livechat_videocall_enabled');
		if (livechatVideoCallEnabled) {
			Settings.upsert({ _id: 'Omnichannel_call_provider' }, {
				$set: { value: 'Jitsi' },
			});
		}
		Settings.removeById('Livechat_videocall_enabled');

		const webRTCEnableChannel = settings.get('WebRTC_Enable_Channel');
		const webRTCEnableDirect = settings.get('WebRTC_Enable_Direct');
		const webRTCEnablePrivate = settings.get('WebRTC_Enable_Private');
		if (webRTCEnableChannel || webRTCEnableDirect || webRTCEnablePrivate) {
			Settings.upsert({ _id: 'WebRTC_Enabled' }, {
				$set: { value: true },
			});
		}
	},
});
