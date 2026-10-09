import type { ISidebarFilter, ISidebarFiltersDisplay } from '@rocket.chat/core-typings';
import { MAX_SIDEBAR_FILTERS, MAX_SUBSCRIPTION_LABELS, SYSTEM_LABEL_KEYS } from '@rocket.chat/core-typings';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import type { SidebarFilterFields } from '../../lib/sidebarFilters';
import {
	createFilter,
	deleteFilter,
	duplicateFilter,
	reorderFilters,
	setSidebarFiltersDisplay,
	updateFilter,
} from '../../lib/sidebarFilters';
import { API } from '../api';

const rateLimiterOptions = { numRequestsAllowed: 20, intervalTimeInMS: 10000 };

const errorResponses = {
	400: validateBadRequestErrorResponse,
	401: validateUnauthorizedErrorResponse,
	403: validateForbiddenErrorResponse,
};

const idSchema = { type: 'string', minLength: 1 } as const;
const nameSchema = { type: 'string', minLength: 1, maxLength: 255 } as const;

const labelRefSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				type: { type: 'string', const: 'user' },
				_id: idSchema,
			},
			required: ['type', '_id'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				type: { type: 'string', const: 'system' },
				key: { type: 'string', enum: [...SYSTEM_LABEL_KEYS] },
			},
			required: ['type', 'key'],
			additionalProperties: false,
		},
	],
} as const;

const ruleSchema = {
	type: 'object',
	properties: {
		mode: { type: 'string', enum: ['any', 'all'] },
		labels: {
			type: 'array',
			items: labelRefSchema,
			maxItems: MAX_SUBSCRIPTION_LABELS + SYSTEM_LABEL_KEYS.length,
		},
	},
	required: ['mode', 'labels'],
	additionalProperties: false,
} as const;

const sortSchema = {
	type: 'object',
	properties: {
		by: { type: 'string', enum: ['activity', 'name'] },
		direction: { type: 'string', enum: ['asc', 'desc'] },
	},
	required: ['by', 'direction'],
	additionalProperties: false,
} as const;

const filterFieldsProperties = {
	name: nameSchema,
	sort: sortSchema,
	matches: ruleSchema,
	notMatches: ruleSchema,
} as const;

const filterResponse = ajv.compile<{ filter: ISidebarFilter }>({
	type: 'object',
	properties: {
		filter: {
			type: 'object',
			properties: {
				_id: { type: 'string' },
				...filterFieldsProperties,
				needsReview: { type: 'boolean', enum: [true] },
			},
			required: ['_id', 'name', 'sort', 'matches', 'notMatches'],
			additionalProperties: false,
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['filter', 'success'],
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

const isSidebarFiltersCreateParamsPOST = ajv.compile<SidebarFilterFields>({
	type: 'object',
	properties: filterFieldsProperties,
	required: ['name', 'sort', 'matches', 'notMatches'],
	additionalProperties: false,
});

const isSidebarFiltersUpdateParamsPOST = ajv.compile<SidebarFilterFields & { filterId: string }>({
	type: 'object',
	properties: {
		filterId: idSchema,
		...filterFieldsProperties,
	},
	required: ['filterId', 'name', 'sort', 'matches', 'notMatches'],
	additionalProperties: false,
});

const isSidebarFiltersDeleteParamsPOST = ajv.compile<{ filterId: string }>({
	type: 'object',
	properties: {
		filterId: idSchema,
	},
	required: ['filterId'],
	additionalProperties: false,
});

const isSidebarFiltersDuplicateParamsPOST = ajv.compile<{ filterId: string; name: string }>({
	type: 'object',
	properties: {
		filterId: idSchema,
		name: nameSchema,
	},
	required: ['filterId', 'name'],
	additionalProperties: false,
});

const isSidebarFiltersReorderParamsPOST = ajv.compile<{ filterIds: string[] }>({
	type: 'object',
	properties: {
		filterIds: {
			type: 'array',
			items: idSchema,
			maxItems: MAX_SIDEBAR_FILTERS,
			uniqueItems: true,
		},
	},
	required: ['filterIds'],
	additionalProperties: false,
});

const isSidebarFiltersSetDisplayPreferencesParamsPOST = ajv.compile<Partial<ISidebarFiltersDisplay>>({
	type: 'object',
	properties: {
		viewMode: { type: 'string', enum: ['extended', 'medium', 'condensed'] },
		displayAvatar: { type: 'boolean' },
	},
	minProperties: 1,
	additionalProperties: false,
});

API.experimental.post(
	'sidebarFilters.create',
	{
		authRequired: true,
		body: isSidebarFiltersCreateParamsPOST,
		response: { 200: filterResponse, ...errorResponses },
		rateLimiterOptions,
	},
	async function action() {
		const filter = await createFilter(this.userId, this.bodyParams);

		return API.experimental.success({ filter });
	},
);

API.experimental.post(
	'sidebarFilters.update',
	{
		authRequired: true,
		body: isSidebarFiltersUpdateParamsPOST,
		response: { 200: filterResponse, ...errorResponses },
		rateLimiterOptions,
	},
	async function action() {
		const { filterId, ...fields } = this.bodyParams;
		const filter = await updateFilter(this.userId, filterId, fields);

		return API.experimental.success({ filter });
	},
);

API.experimental.post(
	'sidebarFilters.delete',
	{
		authRequired: true,
		body: isSidebarFiltersDeleteParamsPOST,
		response: { 200: successResponse, ...errorResponses },
		rateLimiterOptions,
	},
	async function action() {
		await deleteFilter(this.userId, this.bodyParams.filterId);

		return API.experimental.success();
	},
);

API.experimental.post(
	'sidebarFilters.duplicate',
	{
		authRequired: true,
		body: isSidebarFiltersDuplicateParamsPOST,
		response: { 200: filterResponse, ...errorResponses },
		rateLimiterOptions,
	},
	async function action() {
		const filter = await duplicateFilter(this.userId, this.bodyParams.filterId, this.bodyParams.name);

		return API.experimental.success({ filter });
	},
);

API.experimental.post(
	'sidebarFilters.reorder',
	{
		authRequired: true,
		body: isSidebarFiltersReorderParamsPOST,
		response: { 200: successResponse, ...errorResponses },
		rateLimiterOptions,
	},
	async function action() {
		await reorderFilters(this.userId, this.bodyParams.filterIds);

		return API.experimental.success();
	},
);

API.experimental.post(
	'sidebarFilters.setDisplayPreferences',
	{
		authRequired: true,
		body: isSidebarFiltersSetDisplayPreferencesParamsPOST,
		response: { 200: successResponse, ...errorResponses },
		rateLimiterOptions,
	},
	async function action() {
		await setSidebarFiltersDisplay(this.userId, this.bodyParams);

		return API.experimental.success();
	},
);
