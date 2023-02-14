import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { isPOSTLivechatOfflineMessageParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute(
	'livechat/offline.message',
	{ validateParams: isPOSTLivechatOfflineMessageParams },
	{
		async post() {
			const { name, email, message, department, host } = this.bodyParams;
			if (!Livechat.sendOfflineMessage({ name, email, message, department, host })) {
				return API.v1.failure({ message: TAPi18n.__('Error_sending_livechat_offline_message') });
			}

			return API.v1.success({ message: TAPi18n.__('Livechat_offline_message_sent') });
		},
	},
);
