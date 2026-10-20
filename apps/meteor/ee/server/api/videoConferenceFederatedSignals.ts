import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../server/api/api';
import type { FederatedSignalResult } from '../lib/livekit/federatedSignals';
import { sendFederatedHand, sendFederatedReaction } from '../lib/livekit/federatedSignals';

const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const handBodySchema = ajv.compile<{ callId: string; raised: boolean }>({
	type: 'object',
	properties: {
		callId: { type: 'string', minLength: 1 },
		raised: { type: 'boolean' },
	},
	required: ['callId', 'raised'],
	additionalProperties: false,
});

const reactionBodySchema = ajv.compile<{ callId: string; emoji: string }>({
	type: 'object',
	properties: {
		callId: { type: 'string', minLength: 1 },
		// One emoji, with whatever modifiers and joiners it is written with.
		emoji: { type: 'string', minLength: 1, maxLength: 32 },
	},
	required: ['callId', 'emoji'],
	additionalProperties: false,
});

const responses = {
	200: successResponseSchema,
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
	403: validateForbiddenErrorResponse,
};

const answer = (result: FederatedSignalResult) => {
	if ('sent' in result) {
		return API.v1.success();
	}

	if (result.error === 'forbidden') {
		return API.v1.forbidden();
	}

	return API.v1.failure(result.error);
};

API.v1.post(
	'video-conference.hand',
	{
		authRequired: true,
		body: handBodySchema,
		rateLimiterOptions: { numRequestsAllowed: 30, intervalTimeInMS: 60000 },
		response: responses,
	},
	async function action() {
		return answer(await sendFederatedHand(this.bodyParams.callId, this.user, this.bodyParams.raised));
	},
);

API.v1.post(
	'video-conference.reaction',
	{
		authRequired: true,
		body: reactionBodySchema,
		rateLimiterOptions: { numRequestsAllowed: 60, intervalTimeInMS: 60000 },
		response: responses,
	},
	async function action() {
		return answer(await sendFederatedReaction(this.bodyParams.callId, this.user, this.bodyParams.emoji));
	},
);
