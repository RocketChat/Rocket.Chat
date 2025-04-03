import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

// Define schemas for request and response validation using AJV
const statisticsQuerySchema = ajv.compile({
	type: 'object',
	properties: {
		refresh: { type: 'string', enum: ['true', 'false'], default: 'false' },
	}
});

const statisticsListQuerySchema = ajv.compile({
	type: 'object',
	properties: {
		offset: { type: 'integer', minimum: 0, default: 0 },
		count: { type: 'integer', minimum: 1, default: 25 },
		sort: { type: 'object', additionalProperties: true },
		fields: { type: 'object', additionalProperties: true },
		query: { type: 'object', additionalProperties: true },
	},
});

const statisticsResponseSchema = ajv.compile({
	type: 'object',
	properties: {
		statistics: { type: 'object', additionalProperties: true },
		success: { type: 'boolean' },
	},
	required: ['statistics', 'success'],
});

const telemetryRequestSchema = ajv.compile({
	type: 'object',
	properties: {
		params: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					eventName: { type: 'string' },
				},
				required: ['eventName']
			},
		},
	},
	required: ['params'],
});

const telemetryResponseSchema = ajv.compile({
	type: 'object',
	properties: {
		success: { type: 'boolean' },
	},
	required: ['success'],
	additionalProperties: false,
});

// Define API routes with validation and response schemas
API.v1.get(
	'statistics',
	{
		authRequired: true,
		query: statisticsQuerySchema,
		response: { 200: statisticsResponseSchema },
	},
	async function () {
		const { refresh = 'false' } = this.queryParams;

		const statistics = await getLastStatistics({
			userId: this.userId,
			refresh: refresh === 'true',
		});

		return API.v1.success({ statistics, success: true });
	},
);

API.v1.get(
	'statistics.list',
	{
		authRequired: true,
		query: statisticsListQuerySchema,
		response: { 200: statisticsResponseSchema },
	},
	async function () {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();

		const statistics = await getStatistics({
			userId: this.userId,
			query,
			pagination: { offset, count, sort, fields },
		});

		return API.v1.success({ statistics, success: true });
	},
);

API.v1.post(
	'statistics.telemetry',
	{
		authRequired: true,
		body: telemetryRequestSchema,
		response: { 200: telemetryResponseSchema },
	},
	async function () {
		const events = this.bodyParams;

		events?.params?.forEach((event) => {
			const { eventName, ...params } = event;
			void telemetryEvent.call(eventName, params);
		});

		return API.v1.success();
	},
);
