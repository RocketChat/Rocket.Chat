/* eslint-disable @typescript-eslint/naming-convention */
import { Settings } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { trim } from '../../../../../lib/utils/stringUtils';

API.v1.addRoute(
	'omnichannel/saveIntegration',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async post() {
			check(this.bodyParams, {
				Livechat_webhookUrl: Match.Maybe(String),
				Livechat_secret_token: Match.Maybe(String),
				Livechat_http_timeout: Match.Maybe(Number),
				Livechat_webhook_on_start: Match.Maybe(Boolean),
				Livechat_webhook_on_close: Match.Maybe(Boolean),
				Livechat_webhook_on_chat_taken: Match.Maybe(Boolean),
				Livechat_webhook_on_chat_queued: Match.Maybe(Boolean),
				Livechat_webhook_on_forward: Match.Maybe(Boolean),
				Livechat_webhook_on_offline_msg: Match.Maybe(Boolean),
				Livechat_webhook_on_visitor_message: Match.Maybe(Boolean),
				Livechat_webhook_on_agent_message: Match.Maybe(Boolean),
			});

			const {
				Livechat_webhookUrl,
				Livechat_secret_token,
				Livechat_http_timeout,
				Livechat_webhook_on_start,
				Livechat_webhook_on_close,
				Livechat_webhook_on_chat_taken,
				Livechat_webhook_on_chat_queued,
				Livechat_webhook_on_forward,
				Livechat_webhook_on_offline_msg,
				Livechat_webhook_on_visitor_message,
				Livechat_webhook_on_agent_message,
			} = this.bodyParams;

			if (typeof Livechat_webhookUrl !== 'undefined') {
				await Settings.updateValueById('Livechat_webhookUrl', trim(Livechat_webhookUrl));
			}

			if (typeof Livechat_secret_token !== 'undefined') {
				await Settings.updateValueById('Livechat_secret_token', trim(Livechat_secret_token));
			}

			if (typeof Livechat_http_timeout !== 'undefined') {
				await Settings.updateValueById('Livechat_http_timeout', Livechat_http_timeout);
			}

			if (typeof Livechat_webhook_on_start !== 'undefined') {
				await Settings.updateValueById('Livechat_webhook_on_start', !!Livechat_webhook_on_start);
			}

			if (typeof Livechat_webhook_on_close !== 'undefined') {
				await Settings.updateValueById('Livechat_webhook_on_close', !!Livechat_webhook_on_close);
			}

			if (typeof Livechat_webhook_on_chat_taken !== 'undefined') {
				await Settings.updateValueById('Livechat_webhook_on_chat_taken', !!Livechat_webhook_on_chat_taken);
			}

			if (typeof Livechat_webhook_on_chat_queued !== 'undefined') {
				await Settings.updateValueById('Livechat_webhook_on_chat_queued', !!Livechat_webhook_on_chat_queued);
			}

			if (typeof Livechat_webhook_on_forward !== 'undefined') {
				await Settings.updateValueById('Livechat_webhook_on_forward', !!Livechat_webhook_on_forward);
			}

			if (typeof Livechat_webhook_on_offline_msg !== 'undefined') {
				await Settings.updateValueById('Livechat_webhook_on_offline_msg', !!Livechat_webhook_on_offline_msg);
			}

			if (typeof Livechat_webhook_on_visitor_message !== 'undefined') {
				await Settings.updateValueById('Livechat_webhook_on_visitor_message', !!Livechat_webhook_on_visitor_message);
			}

			if (typeof Livechat_webhook_on_agent_message !== 'undefined') {
				await Settings.updateValueById('Livechat_webhook_on_agent_message', !!Livechat_webhook_on_agent_message);
			}
			return API.v1.success();
		},
	},
);
