import type { TelemetryEvents } from '@rocket.chat/core-services';
import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const successResponseSchema = ajv.compile({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: true,
});

API.v1
	.get(
		'statistics',
		{
			authRequired: true,
			response: {
				200: successResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const queryParams = this.queryParams as { refresh?: string };
			const refresh = queryParams.refresh ?? 'false';

			return API.v1.success(
				await getLastStatistics({
					userId: this.userId,
					refresh: refresh === 'true',
				}),
			);
		},
	)
	.get(
		'statistics.list',
		{
			authRequired: true,
			response: {
				200: successResponseSchema,
				400: validateBadRequestErrorResponse,
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

type StatisticsTelemetryBody = {
	params?: Array<{ eventName: string; [key: string]: unknown }>;
};

const statisticsTelemetryBodySchema = ajv.compile<StatisticsTelemetryBody>({
	type: 'object',
	properties: {
		params: {
			type: 'array',
			items: { type: 'object' },
		},
	},
	additionalProperties: true,
});

API.v1.post(
	'statistics.telemetry',
	{
		authRequired: true,
		body: statisticsTelemetryBodySchema,
		response: {
			200: successResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	function action() {
		const events = this.bodyParams;

		events?.params?.forEach((event: { eventName: string; [key: string]: unknown }) => {
			const { eventName, ...params } = event;
			void telemetryEvent.call(eventName as TelemetryEvents, params as never);
		});

		return API.v1.success({});
	},
);
