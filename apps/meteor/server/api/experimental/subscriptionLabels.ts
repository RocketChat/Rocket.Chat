import type { ISubscriptionLabel, SubscriptionLabelColor, SubscriptionLabelIcon } from '@rocket.chat/core-typings';
import { SUBSCRIPTION_LABEL_COLORS, SUBSCRIPTION_LABEL_ICONS } from '@rocket.chat/core-typings';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { createLabel, deleteLabel, updateLabel } from '../../lib/sidebarFilters';
import { API } from '../api';

const rateLimiterOptions = { numRequestsAllowed: 20, intervalTimeInMS: 10000 };

const errorResponses = {
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
	403: validateForbiddenErrorResponse,
};

const nameSchema = { type: 'string', minLength: 1, maxLength: 255 } as const;
const iconSchema = { type: 'string', enum: [...SUBSCRIPTION_LABEL_ICONS] } as const;
const colorSchema = { type: 'string', enum: [...SUBSCRIPTION_LABEL_COLORS] } as const;

const labelSchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		name: { type: 'string' },
		icon: { type: 'string' },
		color: { type: 'string' },
	},
	required: ['_id', 'name', 'icon', 'color'],
	additionalProperties: false,
} as const;

const labelResponse = ajv.compile<{ label: ISubscriptionLabel }>({
	type: 'object',
	properties: {
		label: labelSchema,
		success: { type: 'boolean', enum: [true] },
	},
	required: ['label', 'success'],
	additionalProperties: false,
});

const successResponse = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const isSubscriptionLabelsCreateParamsPOST = ajv.compile<{ name: string; icon?: SubscriptionLabelIcon; color?: SubscriptionLabelColor }>({
	type: 'object',
	properties: {
		name: nameSchema,
		icon: iconSchema,
		color: colorSchema,
	},
	required: ['name'],
	additionalProperties: false,
});

const isSubscriptionLabelsUpdateParamsPOST = ajv.compile<{
	labelId: string;
	name?: string;
	icon?: SubscriptionLabelIcon;
	color?: SubscriptionLabelColor;
}>({
	type: 'object',
	properties: {
		labelId: { type: 'string', minLength: 1 },
		name: nameSchema,
		icon: iconSchema,
		color: colorSchema,
	},
	required: ['labelId'],
	additionalProperties: false,
});

const isSubscriptionLabelsDeleteParamsPOST = ajv.compile<{ labelId: string }>({
	type: 'object',
	properties: {
		labelId: { type: 'string', minLength: 1 },
	},
	required: ['labelId'],
	additionalProperties: false,
});

API.experimental.post(
	'subscriptionLabels.create',
	{
		authRequired: true,
		body: isSubscriptionLabelsCreateParamsPOST,
		response: { 200: labelResponse, ...errorResponses },
		rateLimiterOptions,
	},
	async function action() {
		const label = await createLabel(this.userId, this.bodyParams);

		return API.experimental.success({ label });
	},
);

API.experimental.post(
	'subscriptionLabels.update',
	{
		authRequired: true,
		body: isSubscriptionLabelsUpdateParamsPOST,
		response: { 200: labelResponse, ...errorResponses },
		rateLimiterOptions,
	},
	async function action() {
		const { labelId, ...patch } = this.bodyParams;
		const label = await updateLabel(this.userId, labelId, patch);

		return API.experimental.success({ label });
	},
);

API.experimental.post(
	'subscriptionLabels.delete',
	{
		authRequired: true,
		body: isSubscriptionLabelsDeleteParamsPOST,
		response: { 200: successResponse, ...errorResponses },
		rateLimiterOptions,
	},
	async function action() {
		await deleteLabel(this.userId, this.bodyParams.labelId);

		return API.experimental.success();
	},
);
