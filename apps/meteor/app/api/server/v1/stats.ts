import type { TelemetryMap } from '@rocket.chat/core-services';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type ConvertedTelemetryMap<T extends keyof TelemetryMap = keyof TelemetryMap> = {
	eventName: T;
} & TelemetryMap[T];

API.v1
	.get(
		'statistics',
		{
			authRequired: true,
			query: ajv.compile<{
				refresh: 'true' | 'false';
			}>({
				type: 'object',
				properties: {
					refresh: {
						type: 'string',
						enum: ['true', 'false'],
						default: 'false',
					},
				},
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						statistics: { type: 'object', additionalProperties: true },
						success: { type: 'boolean' },
					},
					required: ['statistics', 'success'],
					additionalProperties: false,
				}),
			},
		},
		async function () {
			const { refresh = 'false' } = this.queryParams;
			const statistics = await getLastStatistics({
				userId: this.userId,
				refresh: refresh === 'true',
			});
			return API.v1.success({ statistics, success: true });
		},
	)
	.get(
		'statistics.list',
		{
			authRequired: true,
			query: ajv.compile<{
				offset: number;
				count: number;
				sort: Record<string, unknown>;
				fields: Record<string, unknown>;
				query: Record<string, unknown>;
			}>({
				type: 'object',
				properties: {
					offset: { type: 'integer', minimum: 0, default: 0 },
					count: { type: 'integer', minimum: 1, default: 25 },
					sort: { type: 'object', additionalProperties: true },
					fields: { type: 'object', additionalProperties: true },
					query: { type: 'object', additionalProperties: true },
				},
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						statistics: { type: 'object', additionalProperties: true },
						success: { type: 'boolean' },
					},
					required: ['statistics', 'success'],
					additionalProperties: false,
				}),
			},
		},
		async function () {
			const { offset, count } = this.queryParams;
			const { sort, fields, query } = await this.parseJsonQuery();
			const { offset: paginationOffset, count: paginationCount } = await getPaginationItems({
				offset,
				count,
			});
			const statistics = await getStatistics({
				userId: this.userId,
				query,
				pagination: { offset: paginationOffset, count: paginationCount, sort, fields },
			});
			return API.v1.success({ statistics, success: true });
		},
	)
	.post(
		'statistics.telemetry',
		{
			authRequired: true,
			body: ajv.compile<{
				params: ConvertedTelemetryMap[];
			}>({
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
			},
		},
		async function () {
			const events = this.bodyParams;
			if (events?.params) {
				events.params.forEach((event) => {
					const { eventName, ...params } = event;
					void telemetryEvent.call(eventName, params);
				});
			}
			return API.v1.success();
		},
	);
