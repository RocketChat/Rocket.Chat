import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server/index';
import { Livechat } from '../lib/Livechat';

type OfflineMessageData = {
	name: string;
	email: string;
	message: string;
};

callbacks.add(
	'livechat.offlineMessage',
	(data: OfflineMessageData): OfflineMessageData | undefined => {
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

		Livechat.sendRequest(postData);
	},
	callbacks.priority.MEDIUM,
	'livechat-send-email-offline-message',
);
