import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

// Schema definitions
const statisticsQuerySchema = ajv.compile({
	type: 'object',
	description: 'Schema for statistics endpoint query parameters',
	properties: {
		refresh: {
			type: 'string',
			enum: ['true', 'false'],
			default: 'false',
			description: 'Whether to force a refresh of the statistics data',
		},
	},
	additionalProperties: false,
});

const statisticsListQuerySchema = ajv.compile({
	type: 'object',
	description: 'Schema for statistics list pagination and filtering',
	properties: {
		offset: {
			type: 'integer',
			minimum: 0,
			default: 0,
			description: 'Pagination offset for results',
		},
		count: {
			type: 'integer',
			minimum: 1,
			default: 25,
			description: 'Number of items to return per page',
		},
		sort: {
			type: 'object',
			additionalProperties: true,
			description: 'Sorting criteria for the results',
		},
		fields: {
			type: 'object',
			additionalProperties: true,
			description: 'Field selection criteria for the results',
		},
		query: {
			type: 'object',
			additionalProperties: true,
			description: 'Filter query criteria for the results',
		},
	},
	additionalProperties: false,
});

const statisticsResponseSchema = ajv.compile({
	type: 'object',
	description: 'Response schema for statistics endpoints',
	properties: {
		statistics: {
			type: 'object',
			additionalProperties: true,
			description: 'The requested statistics data',
		},
		success: {
			type: 'boolean',
			description: 'Indicates if the request was successful',
		},
	},
	required: ['statistics', 'success'],
	additionalProperties: false,
});

const telemetryRequestSchema = ajv.compile({
	type: 'object',
	description: 'Schema for telemetry event submission',
	properties: {
		params: {
			type: 'array',
			description: 'List of telemetry events to record',
			items: {
				type: 'object',
				properties: {
					eventName: {
						type: 'string',
						description: 'Name of the telemetry event to record',
					},
				},
				required: ['eventName'],
				additionalProperties: false,
			},
		},
	},
	required: ['params'],
	additionalProperties: false,
});

const telemetryResponseSchema = ajv.compile({
	type: 'object',
	description: 'Response schema for telemetry submissions',
	properties: {
		success: {
			type: 'boolean',
			description: 'Indicates if the telemetry events were accepted for processing',
		},
	},
	required: ['success'],
	additionalProperties: false,
});

// Handler functions
async function getStatisticsHandler() {
	const { refresh = 'false' } = this.queryParams;
	const statistics = await getLastStatistics({
		userId: this.userId,
		refresh: refresh === 'true',
	});
	return API.v1.success({ statistics, success: true });
}

async function getStatisticsListHandler() {
	const { offset, count } = await getPaginationItems(this.queryParams);
	const { sort, fields, query } = await this.parseJsonQuery();
	const statistics = await getStatistics({
		userId: this.userId,
		query,
		pagination: { offset, count, sort, fields },
	});
	return API.v1.success({ statistics, success: true });
}

async function postTelemetryHandler() {
	const events = this.bodyParams;
	events?.params?.forEach((event) => {
		const { eventName, ...params } = event;
		void telemetryEvent.call(eventName, params);
	});
	return API.v1.success();
}

// API routes configuration
API.v1
	.get(
		'statistics',
		{
			authRequired: true,
			query: statisticsQuerySchema,
			response: { 200: statisticsResponseSchema },
		},
		getStatisticsHandler,
	)
	.get(
		'statistics.list',
		{
			authRequired: true,
			query: statisticsListQuerySchema,
			response: { 200: statisticsResponseSchema },
		},
		getStatisticsListHandler,
	)
	.post(
		'statistics.telemetry',
		{
			authRequired: true,
			body: telemetryRequestSchema,
			response: { 200: telemetryResponseSchema },
		},
		postTelemetryHandler,
	);
