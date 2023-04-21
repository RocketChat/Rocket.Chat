import { isPOSTLivechatOfflineMessageParams } from '@rocket.chat/rest-typings';
import { Translation } from '@rocket.chat/core-services';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute(
	'livechat/offline.message',
	{ validateParams: isPOSTLivechatOfflineMessageParams },
	{
		async post() {
			const { name, email, message, department, host } = this.bodyParams;
			if (!(await Livechat.sendOfflineMessage({ name, email, message, department, host }))) {
				return API.v1.failure({ message: await Translation.translateToServerLanguage('Error_sending_livechat_offline_message') });
			}

			return API.v1.success({ message: await Translation.translateToServerLanguage('Livechat_offline_message_sent') });
		},
	},
);
