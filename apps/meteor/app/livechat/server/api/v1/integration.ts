import { Settings } from '@rocket.chat/models';
import { isPOSTomnichannelIntegrations } from '@rocket.chat/rest-typings';

import { trim } from '../../../../../lib/utils/stringUtils';
import { API } from '../../../../api/server';
import { notifyOnSettingChangedById } from '../../../../lib/server/lib/notifyListener';

API.v1.addRoute(
	'omnichannel/integrations',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: { POST: isPOSTomnichannelIntegrations } },
	{
		async post() {
			const settingsIds = [
				{ _id: 'Livechat_webhookUrl', value: this.bodyParams.LivechatWebhookUrl ? trim(this.bodyParams.LivechatWebhookUrl) : undefined },
				{
					_id: 'Livechat_secret_token',
					value: this.bodyParams.LivechatSecretToken ? trim(this.bodyParams.LivechatSecretToken) : undefined,
				},
				{ _id: 'Livechat_http_timeout', value: this.bodyParams.LivechatHttpTimeout },
				{
					_id: 'Livechat_webhookOnStart',
					value: this.bodyParams.LivechatWebhookOnStart ? !!this.bodyParams.LivechatWebhookOnStart : undefined,
				},
				{
					_id: 'Livechat_webhookOnClose',
					value: this.bodyParams.LivechatWebhookOnClose ? !!this.bodyParams.LivechatWebhookOnClose : undefined,
				},
				{
					_id: 'Livechat_webhookOnChatTaken',
					value: this.bodyParams.LivechatWebhookOnChatTaken ? !!this.bodyParams.LivechatWebhookOnChatTaken : undefined,
				},
				{
					_id: 'Livechat_webhookOnChatQueued',
					value: this.bodyParams.LivechatWebhookOnChatQueued ? !!this.bodyParams.LivechatWebhookOnChatQueued : undefined,
				},
				{
					_id: 'Livechat_webhookOnForward',
					value: this.bodyParams.LivechatWebhookOnForward ? !!this.bodyParams.LivechatWebhookOnForward : undefined,
				},
				{
					_id: 'Livechat_webhookOnOfflineMsg',
					value: this.bodyParams.LivechatWebhookOnOfflineMsg ? !!this.bodyParams.LivechatWebhookOnOfflineMsg : undefined,
				},
				{
					_id: 'Livechat_webhookOnVisitorMessage',
					value: this.bodyParams.LivechatWebhookOnVisitorMessage ? !!this.bodyParams.LivechatWebhookOnVisitorMessage : undefined,
				},
				{
					_id: 'Livechat_webhookOnAgentMessage',
					value: this.bodyParams.LivechatWebhookOnAgentMessage ? !!this.bodyParams.LivechatWebhookOnAgentMessage : undefined,
				},
			];

			const promises = settingsIds
				.filter((setting) => typeof setting.value !== 'undefined')
				.map((setting) => Settings.updateValueById(setting._id, setting.value));

			(await Promise.all(promises)).forEach((value, index) => {
				if (value?.modifiedCount) {
					void notifyOnSettingChangedById(settingsIds[index]._id);
				}
			});

			return API.v1.success();
		},
	},
);
