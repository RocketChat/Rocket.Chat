import type { IOmnichannelSystemMessage } from '@rocket.chat/core-typings';
import { ajv, isPOSTLivechatPageVisitedParams, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../..';
import { savePageHistory } from '../../../lib/omnichannel/tracking';
import type { ExtractRoutesFromAPI } from '../../ApiClass';

const livechatPageVisitedResponseSchema = ajv.compile<void | { page: Pick<IOmnichannelSystemMessage, 'msg' | 'navigation'> }>({
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
								location: {
									type: 'object',
									properties: {
										href: { type: 'string' },
									},
									required: ['href'],
									additionalProperties: false,
								},
								token: { type: 'string' },
							},
							required: ['title', 'location'],
							additionalProperties: true,
						},
					},
					required: ['page'],
					additionalProperties: true,
				},
			},
			required: ['msg', 'navigation'],
			additionalProperties: false,
		},
		success: {
			type: 'boolean',
			enum: [true],
		},
	},
	required: ['success'],
	additionalProperties: false,
});

const livechatPageVisitedEndpoints = API.v1.post(
	'livechat/page.visited',
	{
		body: isPOSTLivechatPageVisitedParams,
		response: {
			200: livechatPageVisitedResponseSchema,
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

type LivechatPageVisitedEndpoints = ExtractRoutesFromAPI<typeof livechatPageVisitedEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type
	interface Endpoints extends LivechatPageVisitedEndpoints {}
}
