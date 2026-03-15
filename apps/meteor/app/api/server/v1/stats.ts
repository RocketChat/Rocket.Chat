import type { IStats } from '@rocket.chat/core-typings';
import { ajv, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const statisticsResponseSchema = ajv.compile<IStats>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: true,
});

const statisticsListResponseSchema = ajv.compile<{ statistics: IStats[]; count: number; offset: number; total: number }>({
	type: 'object',
	properties: {
		statistics: { type: 'array' },
		count: { type: 'number' },
		offset: { type: 'number' },
		total: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['statistics', 'count', 'offset', 'total', 'success'],
	additionalProperties: false,
});

const statisticsTelemetryResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

API.v1.get(
	'statistics',
	{
		authRequired: true,
		response: {
			200: statisticsResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { refresh } = this.queryParams;

		return API.v1.success(
			await getLastStatistics({
				userId: this.userId,
				refresh: refresh === 'true',
			}),
		);
	},
);

API.v1.get(
	'statistics.list',
	{
		authRequired: true,
		response: {
			200: statisticsListResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();

		return API.v1.success(
			await getStatistics({
				userId: this.userId,
				query,
				pagination: {
					offset,
					count,
					sort,
					fields,
				},
			}),
		);
	},
);

API.v1.post(
	'statistics.telemetry',
	{
		authRequired: true,
		response: {
			200: statisticsTelemetryResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	function action() {
		const events = this.bodyParams as Record<string, any>;

		events?.params?.forEach((event: Record<string, any>) => {
			const { eventName, ...params } = event;
			void telemetryEvent.call(eventName, params);
		});

		return API.v1.success();
	},
);
