import type { IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import { ajv, isPOSTLivechatPageVisitedParams, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../..';
import { savePageHistory } from '../../../lib/omnichannel/tracking';

const pageVisitedResponseSchema = ajv.compile<{ page: Pick<IOmnichannelSystemMessage, 'msg' | 'navigation'> } | void>({
	type: 'object',
	properties: {
		page: {
			type: 'object',
			properties: {
				msg: { type: 'string' },
				navigation: {
					type: 'object',
					properties: {
						page: {
							type: 'object',
							properties: {
								title: { type: 'string' },
								change: { type: 'string' },
								location: {
									type: 'object',
									properties: { href: { type: 'string' } },
									required: ['href'],
									additionalProperties: false,
								},
							},
							required: ['title', 'change', 'location'],
							additionalProperties: false,
						},
						token: { type: 'string' },
					},
					required: ['page', 'token'],
					additionalProperties: false,
				},
			},
			required: ['msg'],
			additionalProperties: false,
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

API.v1.post(
	'livechat/page.visited',
	{
		body: isPOSTLivechatPageVisitedParams,
		response: {
			200: pageVisitedResponseSchema,
			400: validateBadRequestErrorResponse,
		},
	},
	async function action() {
		const { token, rid, pageInfo } = this.bodyParams;

		const message = await savePageHistory(token, rid, pageInfo);
		if (!message) {
			return API.v1.success();
		}

		const { msg, navigation } = message as IOmnichannelSystemMessage;
		return API.v1.success({ page: { msg, navigation } });
	},
);
