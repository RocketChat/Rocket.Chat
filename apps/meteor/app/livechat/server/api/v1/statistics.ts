import { Users } from '@rocket.chat/models';
import {
	ajv,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	isLivechatAnalyticsAgentOverviewProps,
	isLivechatAnalyticsOverviewProps,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import type { ExtractRoutesFromAPI } from '../../../../api/server/ApiClass';
import { settings } from '../../../../settings/server';
import { getAgentOverviewDataCached, getAnalyticsOverviewDataCached } from '../../lib/AnalyticsTyped';

const livechatAnalyticsEndpoints = API.v1
	.get(
		'livechat/analytics/agent-overview',
		{
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'],
			query: isLivechatAnalyticsAgentOverviewProps,
			response: {
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				200: ajv.compile<{
					head: { name: string }[];
					data: { name: string; value: number }[];
					success: boolean;
				}>({
					type: 'object',
					properties: {
						head: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									name: { type: 'string' },
								},
								required: ['name'],
								additionalProperties: false,
							},
						},
						data: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									name: { type: 'string' },
									value: { type: 'number' },
								},
								required: ['name', 'value'],
								additionalProperties: false,
							},
						},
						success: { type: 'boolean', enum: [true] },
					},
					required: ['head', 'data', 'success'],
					additionalProperties: false,
				}),
			},
		},
		async function action() {
			const { name, departmentId, from, to } = this.queryParams;

			if (!name) {
				throw new Error('invalid-chart-name');
			}

			const user = await Users.findOneById(this.userId, { projection: { _id: 1, utcOffset: 1 } });
			return API.v1.success(
				await getAgentOverviewDataCached({
					departmentId,
					utcOffset: user?.utcOffset || 0,
					daterange: { from, to },
					chartOptions: { name },
					executedBy: this.userId,
				}),
			);
		},
	)
	.get(
		'livechat/analytics/overview',
		{
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'],
			query: isLivechatAnalyticsOverviewProps,
			response: {
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				200: ajv.compile<
					{
						title: string;
						value: string | number;
					}[]
				>({
					type: 'array',
					items: {
						type: 'object',
						properties: {
							title: { type: 'string' },
							value: { anyOf: [{ type: 'string' }, { type: 'number' }] },
						},
						required: ['title', 'value'],
						additionalProperties: false,
					},
				}),
			},
		},
		async function action() {
			const { name, departmentId, from, to } = this.queryParams;

			if (!name) {
				throw new Error('invalid-chart-name');
			}

			const user = await Users.findOneById(this.userId, { projection: { _id: 1, utcOffset: 1 } });
			const language = user?.language || settings.get('Language') || 'en';

			return API.v1.success(
				await getAnalyticsOverviewDataCached({
					departmentId,
					utcOffset: user?.utcOffset || 0,
					daterange: { from, to },
					analyticsOptions: { name },
					language,
					executedBy: this.userId,
				}),
			);
		},
	);

type LivechatAnalyticsEndpoints = ExtractRoutesFromAPI<typeof livechatAnalyticsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
	interface Endpoints extends LivechatAnalyticsEndpoints {}
}
