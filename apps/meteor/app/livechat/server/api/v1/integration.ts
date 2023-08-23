import { Settings } from '@rocket.chat/models';
import { isPOSTomnichannelIntegrations } from '@rocket.chat/rest-typings';

import { trim } from '../../../../../lib/utils/stringUtils';
import { API } from '../../../../api/server';

API.v1.addRoute(
	'omnichannel/integrations',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: { POST: isPOSTomnichannelIntegrations } },
	{
		async post() {
			const {
				LivechatWebhookUrl,
				LivechatSecretToken,
				LivechatHttpTimeout,
				LivechatWebhookOnStart,
				LivechatWebhookOnClose,
				LivechatWebhookOnChatTaken,
				LivechatWebhookOnChatQueued,
				LivechatWebhookOnForward,
				LivechatWebhookOnOfflineMsg,
				LivechatWebhookOnVisitorMessage,
				LivechatWebhookOnAgentMessage,
			} = this.bodyParams;

			const promises = [];

			if (typeof LivechatWebhookUrl !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhookUrl', trim(LivechatWebhookUrl)));
			}

			if (typeof LivechatSecretToken !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_secret_token', trim(LivechatSecretToken)));
			}

			if (typeof LivechatHttpTimeout !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_http_timeout', LivechatHttpTimeout));
			}

			if (typeof LivechatWebhookOnStart !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_start', !!LivechatWebhookOnStart));
			}

			if (typeof LivechatWebhookOnClose !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_close', !!LivechatWebhookOnClose));
			}

			if (typeof LivechatWebhookOnChatTaken !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_chat_taken', !!LivechatWebhookOnChatTaken));
			}

			if (typeof LivechatWebhookOnChatQueued !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_chat_queued', !!LivechatWebhookOnChatQueued));
			}

			if (typeof LivechatWebhookOnForward !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_forward', !!LivechatWebhookOnForward));
			}

			if (typeof LivechatWebhookOnOfflineMsg !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_offline_msg', !!LivechatWebhookOnOfflineMsg));
			}

			if (typeof LivechatWebhookOnVisitorMessage !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_visitor_message', !!LivechatWebhookOnVisitorMessage));
			}

			if (typeof LivechatWebhookOnAgentMessage !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_agent_message', !!LivechatWebhookOnAgentMessage));
			}

			await Promise.all(promises);
			return API.v1.success();
		},
	},
);
