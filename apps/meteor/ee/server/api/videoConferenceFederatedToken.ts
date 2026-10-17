import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import type { FederatedToken } from '../lib/livekit/federatedToken';
import { getFederatedToken } from '../lib/livekit/federatedToken';

const federatedTokenResponseSchema = ajv.compile<FederatedToken>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
		serverUrl: { type: 'string' },
		token: { type: 'string' },
	},
	required: ['success', 'serverUrl', 'token'],
	additionalProperties: false,
});

const federatedTokenQuerySchema = ajv.compile<{ callId: string; serverName: string; transport: string }>({
	type: 'object',
	properties: {
		callId: { type: 'string', minLength: 1 },
		serverName: { type: 'string', minLength: 1 },
		transport: { type: 'string', minLength: 1 },
	},
	required: ['callId', 'serverName', 'transport'],
	additionalProperties: false,
});

API.v1.get(
	'video-conference.federatedToken',
	{
		authRequired: true,
		query: federatedTokenQuerySchema,
		// One per remote SFU in the call, and again whenever that connection is reopened.
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60000 },
		response: {
			200: federatedTokenResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { callId, serverName, transport } = this.queryParams;
		const result = await getFederatedToken(callId, this.user, serverName, transport);

		if ('token' in result) {
			return API.v1.success(result.token);
		}

		if (result.error === 'forbidden') {
			return API.v1.forbidden();
		}

		return API.v1.failure(result.error);
	},
);
