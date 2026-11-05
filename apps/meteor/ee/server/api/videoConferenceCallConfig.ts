import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import type { CallConfig } from '../lib/livekit/callConfig';
import { getCallConfig } from '../lib/livekit/callConfig';

const callConfigResponseSchema = ajv.compile<CallConfig>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
		providerName: { type: 'string' },
		livekit: {
			type: 'object',
			properties: {
				serverUrl: { type: 'string' },
				token: { type: 'string' },
				roomName: { type: 'string' },
			},
			required: ['serverUrl', 'token', 'roomName'],
			additionalProperties: false,
		},
	},
	required: ['success', 'providerName'],
	additionalProperties: false,
});

const callIdQuerySchema = ajv.compile<{ callId: string }>({
	type: 'object',
	properties: { callId: { type: 'string', minLength: 1 } },
	required: ['callId'],
	additionalProperties: false,
});

/** The configuration a member needs to set their call up; providers that need none answer with their name only. */
API.v1.get(
	'video-conference.callConfig',
	{
		authRequired: true,
		query: callIdQuerySchema,
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: {
			200: callConfigResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const result = await getCallConfig(this.queryParams.callId, this.user);

		if ('config' in result) {
			return API.v1.success(result.config);
		}

		if (result.error === 'forbidden') {
			return API.v1.forbidden();
		}

		return API.v1.failure(result.error);
	},
);
