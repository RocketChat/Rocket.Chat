import { sendRequest } from '../../../app/livechat/server/lib/webhooks';
import { settings } from '../../../app/settings/server';
import { callbacks } from '../../lib/callbacks';

callbacks.add(
	'livechat.offlineMessage',
	async (data) => {
		if (!settings.get('Livechat_webhook_on_offline_msg')) {
			return data;
		}

		const postData = {
			type: 'LivechatOfflineMessage',
			sentAt: new Date(),
			visitor: {
				name: data.name,
				email: data.email,
			},
			message: data.message,
		};

		await sendRequest(postData);
	},
	callbacks.priority.MEDIUM,
	'livechat-send-email-offline-message',
);
