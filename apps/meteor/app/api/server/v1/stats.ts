import type { IStats } from '@rocket.chat/core-typings';
import {
	ajv,
	isStatisticsProps,
	isStatisticsListProps,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const statisticsEndpoints = API.v1.get(
	'statistics',
	{
		authRequired: true,
		query: isStatisticsProps,
		response: {
			200: ajv.compile<IStats>({
				type: 'object',
				additionalProperties: true,
				properties: {
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['success'],
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
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

const statisticsListEndpoints = API.v1.get(
	'statistics.list',
	{
		authRequired: true,
		query: isStatisticsListProps,
		response: {
			200: ajv.compile<{
				statistics: IStats[];
				count: number;
				offset: number;
				total: number;
			}>({
				type: 'object',
				additionalProperties: false,
				properties: {
					statistics: {
						type: 'array',
						items: { type: 'object', additionalProperties: true },
					},
					count: {
						type: 'number',
						description: 'The number of statistics items returned in this response.',
					},
					offset: {
						type: 'number',
						description: 'The number of statistics items that were skipped in this response.',
					},
					total: {
						type: 'number',
						description: 'The total number of statistics items that match the query.',
					},
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['statistics', 'count', 'offset', 'total', 'success'],
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | number | null | undefined>);
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

type TelemetryParam = {
	eventName: string;
	timestamp?: number;
	[key: string]: unknown;
};

type TelemetryPayload = {
	params: TelemetryParam[];
};

const isTelemetryPayload = ajv.compile<TelemetryPayload>({
	type: 'object',
	properties: {
		params: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					eventName: { type: 'string' },
					timestamp: { type: 'number', nullable: true },
				},
				required: ['eventName'],
				additionalProperties: true,
			},
		},
	},
	required: ['params'],
	additionalProperties: false,
});

const statisticsTelemetryEndpoints = API.v1.post(
	'statistics.telemetry',
	{
		authRequired: true,
		validateParams: isTelemetryPayload,
		body: isTelemetryPayload,
		response: {
			200: ajv.compile<Record<string, never>>({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
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

		events?.params?.forEach((event: TelemetryParam) => {
			const { eventName, ...params } = event;
			void telemetryEvent.call(eventName as Parameters<typeof telemetryEvent.call>[0], params as Parameters<typeof telemetryEvent.call>[1]);
		});

		return API.v1.success();
	},
);

type StatisticsGetEndpoints = ExtractRoutesFromAPI<typeof statisticsEndpoints>;

type StatisticsListGetEndpoints = ExtractRoutesFromAPI<typeof statisticsListEndpoints>;

type StatisticsTelemetryPostEndpoints = ExtractRoutesFromAPI<typeof statisticsTelemetryEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends StatisticsGetEndpoints {}
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends StatisticsListGetEndpoints {}
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends StatisticsTelemetryPostEndpoints {}
}
