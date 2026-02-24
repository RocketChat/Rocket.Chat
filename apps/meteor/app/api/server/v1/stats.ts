import type { TelemetryEvents } from '@rocket.chat/core-services';
import type { IStats } from '@rocket.chat/core-typings';
import { ajv, validateUnauthorizedErrorResponse, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type SlashCommand = { command: string };

type SettingsCounter = { settingsId: string };

type Param = {
	eventName: TelemetryEvents;
	timestamp?: number;
} & (SlashCommand | SettingsCounter);

type TelemetryPayload = {
	params: Param[];
};

type StatisticsProps = { refresh?: 'true' | 'false' };

const StatisticsSchema = {
	type: 'object',
	properties: {
		refresh: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

const isStatisticsProps = ajv.compile<StatisticsProps>(StatisticsSchema);

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

export type StatisticsEndpoints = ExtractRoutesFromAPI<typeof statisticsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends StatisticsEndpoints {}
}
