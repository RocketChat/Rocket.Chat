import { isPOSTLivechatOfflineMessageParams } from '@rocket.chat/rest-typings';

import { i18n } from '../../../../../server/lib/i18n';
import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute(
	'livechat/offline.message',
	{ validateParams: isPOSTLivechatOfflineMessageParams },
	{
		async post() {
			const { name, email, message, department, host } = this.bodyParams;
			try {
				await Livechat.sendOfflineMessage({ name, email, message, department, host });
				return API.v1.success({ message: i18n.t('Livechat_offline_message_sent') });
			} catch (e) {
				return API.v1.failure(i18n.t('Error_sending_livechat_offline_message'));
			}
		},
	},
);
