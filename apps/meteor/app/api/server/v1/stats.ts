import { ajv, ajvQuery, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const StatisticsQuerySchema = {
	type: 'object',
	properties: {
		refresh: { type: 'string', enum: ['true', 'false'] },
	},
	required: [],
	additionalProperties: false,
} as const;

const isStatisticsProps = ajvQuery.compile<{ refresh?: 'true' | 'false' }>(StatisticsQuerySchema);

const statisticsResponseSchema = ajv.compile<Record<string, unknown>>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: true,
});

API.v1.get(
	'statistics',
	{
		authRequired: true,
		query: isStatisticsProps,
		response: {
			200: statisticsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { refresh = 'false' } = this.queryParams;

		return API.v1.success(
			await getLastStatistics({
				userId: this.userId,
				refresh: refresh === 'true',
			}),
		);
	},
);

API.v1.addRoute(
	'statistics.list',
	{ authRequired: true },
	{
		async get() {
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
	},
);

API.v1.addRoute(
	'statistics.telemetry',
	{ authRequired: true },
	{
		post() {
			const events = this.bodyParams;

			events?.params?.forEach((event) => {
				const { eventName, ...params } = event;
				void telemetryEvent.call(eventName, params);
			});

			return API.v1.success();
		},
	},
);
