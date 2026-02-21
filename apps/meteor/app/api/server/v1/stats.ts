import type { TelemetryEvents, TelemetryMap } from '@rocket.chat/core-services';
import type { IStats } from '@rocket.chat/core-typings';
import { ajv, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.get(
	'statistics',
	{
		authRequired: true,
		query: ajv.compile<{ refresh?: 'true' | 'false' }>({
			type: 'object',
			properties: {
				refresh: {
					type: 'string',
					nullable: true,
				},
			},
			required: [],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<IStats>({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['success'],
			}),
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { refresh = 'false' } = this.queryParams;

		const stats = await getLastStatistics({
			userId: this.userId,
			refresh: refresh === 'true',
		});

		if (!stats) {
			throw new Error('No statistics found');
		}

		return API.v1.success(stats);
	},
);

API.v1.get(
	'statistics.list',
	{
		authRequired: true,
		query: ajv.compile<{ fields?: string; count?: number; offset?: number; sort?: string; query?: string }>({
			type: 'object',
			properties: {
				fields: { type: 'string', nullable: true },
				count: { type: 'number', nullable: true },
				offset: { type: 'number', nullable: true },
				sort: { type: 'string', nullable: true },
				query: { type: 'string', nullable: true },
			},
			required: [],
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{
				statistics: unknown[];
				count: number;
				offset: number;
				total: number;
			}>({
				type: 'object',
				properties: {
					statistics: { type: 'array' },
					count: { type: 'number' },
					offset: { type: 'number' },
					total: { type: 'number' },
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['statistics', 'count', 'offset', 'total', 'success'],
			}),
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
		body: ajv.compile<{ params: { eventName: string; [key: string]: unknown }[] }>({
			type: 'object',
			properties: {
				params: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							eventName: { type: 'string' },
						},
						required: ['eventName'],
					},
				},
			},
			required: ['params'],
		}),
		response: {
			200: ajv.compile<void>({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: validateUnauthorizedErrorResponse,
		},
	},
	function action() {
		const events = this.bodyParams;

		events.params.forEach((event) => {
			const { eventName, ...params } = event;
			void telemetryEvent.call(eventName as TelemetryEvents, params as TelemetryMap[TelemetryEvents]);
		});

		return API.v1.success();
	},
);
