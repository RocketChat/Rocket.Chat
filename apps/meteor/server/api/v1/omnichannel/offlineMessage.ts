import { ajv, isPOSTLivechatOfflineMessageParams, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../..';
import { i18n } from '../../../lib/i18n';
import { sendOfflineMessage } from '../../../lib/omnichannel/messages';

const offlineMessageResponseSchema = ajv.compile<{ message: string }>({
	type: 'object',
	properties: {
		message: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['message', 'success'],
	additionalProperties: false,
});

API.v1.post(
	'livechat/offline.message',
	{
		body: isPOSTLivechatOfflineMessageParams,
		rateLimiterOptions: { numRequestsAllowed: 1, intervalTimeInMS: 5000 },
		response: {
			200: offlineMessageResponseSchema,
			400: validateBadRequestErrorResponse,
		},
	},
	async function action() {
		const { name, email, message, department, host } = this.bodyParams;
		try {
			await sendOfflineMessage({ name, email, message, department, host });
			return API.v1.success({ message: i18n.t('Livechat_offline_message_sent') });
		} catch (e) {
			return API.v1.failure(i18n.t('Error_sending_livechat_offline_message'));
		}
	},
);
