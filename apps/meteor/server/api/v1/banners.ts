import { Banner } from '@rocket.chat/core-services';
import type { IBanner } from '@rocket.chat/core-typings';
import {
	ajv,
	isBannerIdParams,
	isBannersDismissProps,
	isBannersProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../api';

const bannersResponseSchema = ajv.compile<{ banners: IBanner[] }>({
	type: 'object',
	properties: {
		banners: { type: 'array', items: { $ref: '#/components/schemas/IBanner' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['banners', 'success'],
	additionalProperties: false,
});

const dismissResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

API.v1.get(
	'banners/:id',
	{
		authRequired: true,
		summary: 'Get a banner by id',
		description: 'Gets the banner to be shown to the authenticated user.',
		tags: ['Banners'],
		query: isBannersProps,
		params: isBannerIdParams,
		examples: {
			params: { id: 'ByehQjC44FwMeiLbX' },
			query: { platform: 'web' },
		},
		responseDescriptions: {
			200: 'A collection with a single banner matching the criteria; an empty collection otherwise',
		},
		response: {
			200: bannersResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { platform } = this.queryParams;
		const { id } = this.urlParams;

		const banners = await Banner.getBannersForUser(this.userId, platform, id);

		return API.v1.success({ banners });
	},
);

API.v1.get(
	'banners',
	{
		authRequired: true,
		summary: 'List banners',
		description: 'Gets the banners to be shown to the authenticated user.',
		tags: ['Banners'],
		query: isBannersProps,
		examples: {
			query: { platform: 'web' },
		},
		responseDescriptions: {
			200: 'The banners matching the criteria',
		},
		response: {
			200: bannersResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { platform } = this.queryParams;

		const banners = await Banner.getBannersForUser(this.userId, platform);

		return API.v1.success({ banners });
	},
);

API.v1.post(
	'banners.dismiss',
	{
		authRequired: true,
		summary: 'Dismiss a banner',
		description: 'Dismisses a banner for the authenticated user, so it is no longer returned by the banner endpoints.',
		tags: ['Banners'],
		body: isBannersDismissProps,
		examples: {
			body: { bannerId: 'ByehQjC44FwMeiLbX' },
		},
		responseDescriptions: {
			200: 'The banner was dismissed',
		},
		response: {
			200: dismissResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { bannerId } = this.bodyParams;

		await Banner.dismiss(this.userId, bannerId);
		return API.v1.success();
	},
);
