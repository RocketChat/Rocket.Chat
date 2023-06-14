import { isPOSTLivechatOfflineMessageParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';
import { i18n } from '../../../../../server/lib/i18n';

API.v1.addRoute(
	'livechat/offline.message',
	{ validateParams: isPOSTLivechatOfflineMessageParams },
	{
		async post() {
			const { name, email, message, department, host } = this.bodyParams;
			if (!(await Livechat.sendOfflineMessage({ name, email, message, department, host }))) {
				return API.v1.failure({ message: i18n.t('Error_sending_livechat_offline_message') });
			}

			return API.v1.success({ message: i18n.t('Livechat_offline_message_sent') });
		},
	},
);
