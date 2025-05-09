import { isPOSTLivechatOfflineMessageParams } from '@rocket.chat/rest-typings';

import { i18n } from '../../../../../server/lib/i18n';
import { API } from '../../../../api/server';
import { sendOfflineMessage } from '../../lib/messages';

API.v1.addRoute(
	'livechat/offline.message',
	{
		validateParams: isPOSTLivechatOfflineMessageParams,
		rateLimiterOptions: { numRequestsAllowed: 1, intervalTimeInMS: 5000 },
	},
	{
		async post() {
			const { name, email, message, department, host } = this.bodyParams;
			try {
				await sendOfflineMessage({ name, email, message, department, host });
				return API.v1.success({ message: i18n.t('Livechat_offline_message_sent') });
			} catch (e) {
				return API.v1.failure(i18n.t('Error_sending_livechat_offline_message'));
			}
		},
	},
);
