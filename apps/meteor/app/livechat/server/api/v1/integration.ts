import { Settings } from '@rocket.chat/models';
import { isPOSTomnichannelIntegrations } from '@rocket.chat/rest-typings';

import { trim } from '../../../../../lib/utils/stringUtils';
import { updateAuditedByUser } from '../../../../../server/settings/lib/auditedSettingUpdates';
import { API } from '../../../../api/server';
import { notifyOnSettingChangedById } from '../../../../lib/server/lib/notifyListener';

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

			const settingsIds = [
				typeof LivechatWebhookUrl !== 'undefined' && { _id: 'Livechat_webhookUrl', value: trim(LivechatWebhookUrl) },
				typeof LivechatSecretToken !== 'undefined' && { _id: 'Livechat_secret_token', value: trim(LivechatSecretToken) },
				typeof LivechatHttpTimeout !== 'undefined' && { _id: 'Livechat_http_timeout', value: LivechatHttpTimeout },
				typeof LivechatWebhookOnStart !== 'undefined' && { _id: 'Livechat_webhook_on_start', value: !!LivechatWebhookOnStart },
				typeof LivechatWebhookOnClose !== 'undefined' && { _id: 'Livechat_webhook_on_close', value: !!LivechatWebhookOnClose },
				typeof LivechatWebhookOnChatTaken !== 'undefined' && { _id: 'Livechat_webhook_on_chat_taken', value: !!LivechatWebhookOnChatTaken },
				typeof LivechatWebhookOnChatQueued !== 'undefined' && {
					_id: 'Livechat_webhook_on_chat_queued',
					value: !!LivechatWebhookOnChatQueued,
				},
				typeof LivechatWebhookOnForward !== 'undefined' && { _id: 'Livechat_webhook_on_forward', value: !!LivechatWebhookOnForward },
				typeof LivechatWebhookOnOfflineMsg !== 'undefined' && {
					_id: 'Livechat_webhook_on_offline_msg',
					value: !!LivechatWebhookOnOfflineMsg,
				},
				typeof LivechatWebhookOnVisitorMessage !== 'undefined' && {
					_id: 'Livechat_webhook_on_visitor_message',
					value: !!LivechatWebhookOnVisitorMessage,
				},
				typeof LivechatWebhookOnAgentMessage !== 'undefined' && {
					_id: 'Livechat_webhook_on_agent_message',
					value: !!LivechatWebhookOnAgentMessage,
				},
			].filter(Boolean) as unknown as { _id: string; value: any }[];

			const auditSettingOperation = updateAuditedByUser({
				_id: this.userId,
				username: this.user.username!,
				ip: this.requestIp,
				useragent: this.request.headers.get('user-agent') || '',
			});

			const promises = settingsIds.map((setting) => auditSettingOperation(Settings.updateValueById, setting._id, setting.value));

			(await Promise.all(promises)).forEach((value, index) => {
				if (value?.modifiedCount) {
					void notifyOnSettingChangedById(settingsIds[index]._id);
				}
			});

			return API.v1.success();
		},
	},
);
