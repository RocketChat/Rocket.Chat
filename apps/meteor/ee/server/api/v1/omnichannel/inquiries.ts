import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { setSLAToInquiry } from './lib/inquiries';
import { API } from '../../../../../server/api';

const isPUTLivechatInquirySetSlaParams = ajv.compile<{ roomId: string; sla: string }>({
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		sla: { type: 'string' },
	},
	required: ['roomId', 'sla'],
	additionalProperties: false,
});

const inquirySetSlaResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

API.v1.put(
	'livechat/inquiry.setSLA',
	{
		authRequired: true,
		permissionsRequired: {
			PUT: { permissions: ['view-l-room', 'manage-livechat-sla'], operation: 'hasAny' },
		},
		license: ['livechat-enterprise'],
		body: isPUTLivechatInquirySetSlaParams,
		response: {
			200: inquirySetSlaResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { roomId, sla } = this.bodyParams;
		await setSLAToInquiry({
			userId: this.userId,
			roomId,
			sla,
		});
		return API.v1.success();
	},
);
