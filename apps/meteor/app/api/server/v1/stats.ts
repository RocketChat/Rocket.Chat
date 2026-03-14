import type { IStats } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import {
	ajv,
	isStatisticsProps,
	isStatisticsListProps,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type TelemetryBody = {
	params?: { eventName: string; [key: string]: unknown }[];
};

const TelemetryBodySchema = {
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
				additionalProperties: true,
			},
			nullable: true,
		},
	},
	additionalProperties: true,
};

const isTelemetryBody = ajv.compile<TelemetryBody>(TelemetryBodySchema);

const statsEndpoints = API.v1
	.get(
		'statistics',
		{
			authRequired: true,
			query: isStatisticsProps,
			response: {
				200: ajv.compile<IStats & { success: true }>({
					type: 'object',
					additionalProperties: true,
					properties: {
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
				}),
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
	)
	.get(
		'statistics.list',
		{
			authRequired: true,
			query: isStatisticsListProps,
			response: {
				200: ajv.compile<PaginatedResult<{ statistics: IStats[] }>>({
					type: 'object',
					properties: {
						statistics: { type: 'array', items: { type: 'object', additionalProperties: true } },
						count: { type: 'number' },
						offset: { type: 'number' },
						total: { type: 'number' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['statistics', 'count', 'offset', 'total', 'success'],
					additionalProperties: false,
				}),
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
	)
	.post(
		'statistics.telemetry',
		{
			authRequired: true,
			body: isTelemetryBody,
			response: {
				200: ajv.compile<void>({
					type: 'object',
					properties: {
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		function action() {
			const events = this.bodyParams;

			events?.params?.forEach((event) => {
				const { eventName, ...params } = event;
				void telemetryEvent.call(eventName as import('@rocket.chat/core-services').TelemetryEvents, params as any);
			});

			return API.v1.success();
		},
	);

export type StatsEndpoints = ExtractRoutesFromAPI<typeof statsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends StatsEndpoints {}
}
