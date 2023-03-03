/* eslint-disable @typescript-eslint/naming-convention */
import { Settings } from '@rocket.chat/models';
import Ajv from 'ajv';

import { API } from '../../../../api/server';
import { trim } from '../../../../../lib/utils/stringUtils';

const ajv = new Ajv({ coerceTypes: true });

type POSTomnichannelIntegrations = {
	Livechat_webhookUrl: string;
	Livechat_secret_token: string;
	Livechat_http_timeout: number;
	Livechat_webhook_on_start: boolean;
	Livechat_webhook_on_close: boolean;
	Livechat_webhook_on_chat_taken: boolean;
	Livechat_webhook_on_chat_queued: boolean;
	Livechat_webhook_on_forward: boolean;
	Livechat_webhook_on_offline_msg: boolean;
	Livechat_webhook_on_visitor_message: boolean;
	Livechat_webhook_on_agent_message: boolean;
};

const POSTomnichannelIntegrationsSchema = {
	type: 'object',
	properties: {
		Livechat_webhookUrl: {
			type: 'string',
		},
		Livechat_secret_token: {
			type: 'string',
		},
		Livechat_http_timeout: {
			type: 'number',
		},
		Livechat_webhook_on_start: {
			type: 'boolean',
		},
		Livechat_webhook_on_close: {
			type: 'boolean',
		},
		Livechat_webhook_on_chat_taken: {
			type: 'boolean',
		},
		Livechat_webhook_on_chat_queued: {
			type: 'boolean',
		},
		Livechat_webhook_on_forward: {
			type: 'boolean',
		},
		Livechat_webhook_on_offline_msg: {
			type: 'boolean',
		},
		Livechat_webhook_on_visitor_message: {
			type: 'boolean',
		},
		Livechat_webhook_on_agent_message: {
			type: 'boolean',
		},
	},
	required: [],
	additionalProperties: false,
};

export const isPOSTomnichannelIntegrations = ajv.compile<POSTomnichannelIntegrations>(POSTomnichannelIntegrationsSchema);

API.v1.addRoute(
	'omnichannel/integrations',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: { POST: isPOSTomnichannelIntegrations } },
	{
		async post() {
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

			const promises = [];

			if (typeof Livechat_webhookUrl !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhookUrl', trim(Livechat_webhookUrl)));
			}

			if (typeof Livechat_secret_token !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_secret_token', trim(Livechat_secret_token)));
			}

			if (typeof Livechat_http_timeout !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_http_timeout', Livechat_http_timeout));
			}

			if (typeof Livechat_webhook_on_start !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_start', !!Livechat_webhook_on_start));
			}

			if (typeof Livechat_webhook_on_close !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_close', !!Livechat_webhook_on_close));
			}

			if (typeof Livechat_webhook_on_chat_taken !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_chat_taken', !!Livechat_webhook_on_chat_taken));
			}

			if (typeof Livechat_webhook_on_chat_queued !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_chat_queued', !!Livechat_webhook_on_chat_queued));
			}

			if (typeof Livechat_webhook_on_forward !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_forward', !!Livechat_webhook_on_forward));
			}

			if (typeof Livechat_webhook_on_offline_msg !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_offline_msg', !!Livechat_webhook_on_offline_msg));
			}

			if (typeof Livechat_webhook_on_visitor_message !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_visitor_message', !!Livechat_webhook_on_visitor_message));
			}

			if (typeof Livechat_webhook_on_agent_message !== 'undefined') {
				promises.push(Settings.updateValueById('Livechat_webhook_on_agent_message', !!Livechat_webhook_on_agent_message));
			}

			await Promise.all(promises);
			return API.v1.success();
		},
	},
);
