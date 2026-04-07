import {
	ajv,
	isStatisticsProps,
	isStatisticsListProps,
	isTelemetryPayload,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';
import type { IStats } from '@rocket.chat/core-typings';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

const statisticsEndpoints = API.v1
	.get(
		'statistics',
		{
			authRequired: true,
			query: isStatisticsProps,
			response: {
				200: ajv.compile<IStats>({
					type: 'object',
					additionalProperties: true,
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
				200: ajv.compile<{
					statistics: IStats[];
					count: number;
					offset: number;
					total: number;
					success: boolean;
				}>({
					type: 'object',
					properties: {
						statistics: { type: 'array', items: { type: 'object' } },
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
			body: isTelemetryPayload,
			response: {
				200: ajv.compile<{ success: boolean }>({
					type: 'object',
					properties: { success: { type: 'boolean', enum: [true] } },
					required: ['success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const events = this.bodyParams;

			events?.params?.forEach((event) => {
				const { eventName, ...params } = event;
				void telemetryEvent.call(eventName, params);
			});

			return API.v1.success();
		},
	);

type ServerStatisticsEndpoints = ExtractRoutesFromAPI<typeof statisticsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ServerStatisticsEndpoints {}
}
