import type { TelemetryEvents } from '@rocket.chat/core-services';
import type { IStats } from '@rocket.chat/core-typings';
import { ajv, validateUnauthorizedErrorResponse, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type StatisticsProps = { refresh?: 'true' | 'false' };

const StatisticsSchema = {
	type: 'object',
	properties: {
		refresh: {
			enum: ['true', 'false'],
			default: 'false',
		},
	},
	required: [],
	additionalProperties: false,
};

const isStatisticsProps = ajv.compile<StatisticsProps>(StatisticsSchema);

type StatisticsListProps = {
	offset: number;
	count?: number;
};

const StatisticsListSchema = {
	type: 'object',
	properties: {
		offset: {
			type: 'number',
			default: 0,
			minimum: 0,
		},
		count: {
			type: 'number',
			default: 100,
			minimum: 1,
		},
	},
	required: [],
	additionalProperties: false,
};

const isStatisticsListProps = ajv.compile<StatisticsListProps>(StatisticsListSchema);

type OTREnded = { rid: string };

type SlashCommand = { command: string };

type SettingsCounter = { settingsId: string };

type Param = {
	eventName: TelemetryEvents;
	timestamp?: number;
} & (OTREnded | SlashCommand | SettingsCounter);

type TelemetryPayload = {
	params: Param[];
};

const statisticsEndpoints = API.v1
	.get(
		'statistics',
		{
			authRequired: true,
			query: isStatisticsProps,
			response: {
				200: ajv.compile<IStats>({
					allOf: [
						{ $ref: '#/components/schemas/IStats' },
						{
							type: 'object',
							properties: {
								success: { type: 'boolean', enum: [true] },
							},
							required: ['success'],
						},
					],
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
				200: ajv.compile<{ statistics: IStats[]; count: number; offset: number; total: number }>({
					type: 'object',
					properties: {
						statistics: {
							type: 'array',
							items: { $ref: '#/components/schemas/IStats' },
							minItems: 0,
						},
						count: { type: 'integer', minimum: 1 },
						offset: { type: 'integer', minimum: 0, default: 0 },
						total: { type: 'integer', minimum: 1 },
						success: { type: 'boolean', enum: [true] },
					},
					additionalProperties: false,
					required: ['statistics', 'count', 'offset', 'total', 'success'],
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
			body: ajv.compile<TelemetryPayload>({
				oneOf: [
					{
						type: 'object',
						properties: {
							eventName: { const: 'otrStats' },
							rid: { type: 'string' },
						},
						required: ['eventName', 'rid'],
						additionalProperties: false,
					},
					{
						type: 'object',
						properties: {
							eventName: { const: 'slashCommandsStats' },
							command: { type: 'string' },
						},
						required: ['eventName', 'command'],
						additionalProperties: false,
					},
					{
						type: 'object',
						properties: {
							eventName: { const: 'updateCounter' },
							settingsId: { type: 'string' },
						},
						required: ['eventName', 'settingsId'],
						additionalProperties: false,
					},
				],
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						success: { type: 'boolean' },
					},
					required: ['success'],
					additionalProperties: false,
				}),
				400: ajv.compile<{
					error?: string;
					errorType?: string;
					stack?: string;
					details?: string;
				}>({
					type: 'object',
					properties: {
						success: { type: 'boolean', enum: [false] },
						stack: { type: 'string' },
						error: { type: 'string' },
						errorType: { type: 'string' },
						details: { type: 'string' },
					},
					required: ['success'],
					additionalProperties: false,
				}),
				401: ajv.compile({
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							enum: [false],
						},
						status: { type: 'string' },
						message: { type: 'string' },
						error: { type: 'string' },
						errorType: { type: 'string' },
					},
					required: ['success'],
					additionalProperties: false,
				}),
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

export type StatisticsEndpoints = ExtractRoutesFromAPI<typeof statisticsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends StatisticsEndpoints {}
}
