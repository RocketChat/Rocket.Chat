import { MAX_SUBSCRIPTION_LABELS } from '@rocket.chat/core-typings';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { readSubscriptions, setSubscriptionLabels } from '../../lib/sidebarFilters';
import { API } from '../api';

const rateLimiterOptions = { numRequestsAllowed: 20, intervalTimeInMS: 10000 };

const MAX_READ_MANY_ROOMS = 500;

const successResponse = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const responses = {
	200: successResponse,
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
	403: validateForbiddenErrorResponse,
};

const isSubscriptionsSetLabelsParamsPOST = ajv.compile<{ roomId: string; labelIds: string[] }>({
	type: 'object',
	properties: {
		roomId: { type: 'string', minLength: 1 },
		labelIds: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			maxItems: MAX_SUBSCRIPTION_LABELS,
			uniqueItems: true,
		},
	},
	required: ['roomId', 'labelIds'],
	additionalProperties: false,
});

const isSubscriptionsReadManyParamsPOST = ajv.compile<{ roomIds: string[] }>({
	type: 'object',
	properties: {
		roomIds: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			minItems: 1,
			maxItems: MAX_READ_MANY_ROOMS,
			uniqueItems: true,
		},
	},
	required: ['roomIds'],
	additionalProperties: false,
});

API.experimental.post(
	'subscriptions.setLabels',
	{
		authRequired: true,
		body: isSubscriptionsSetLabelsParamsPOST,
		response: responses,
		rateLimiterOptions,
	},
	async function action() {
		await setSubscriptionLabels(this.userId, this.bodyParams.roomId, this.bodyParams.labelIds);

		return API.experimental.success();
	},
);

API.experimental.post(
	'subscriptions.readMany',
	{
		authRequired: true,
		body: isSubscriptionsReadManyParamsPOST,
		response: responses,
		rateLimiterOptions,
	},
	async function action() {
		await readSubscriptions(this.userId, this.bodyParams.roomIds);

		return API.experimental.success();
	},
);
