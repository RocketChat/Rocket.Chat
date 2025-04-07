import {
	isLivechatAnalyticsAgentsTotalServiceTimeProps,
	isLivechatAnalyticsAgentsAverageServiceTimeProps,
	isLivechatAnalyticsAgentsAvailableForServiceHistoryProps,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import {
	findAllAverageServiceTimeAsync,
	findAllServiceTimeAsync,
	findAvailableServiceTimeHistoryAsync,
} from '../../../../../app/livechat/server/lib/analytics/agents';

API.v1.addRoute(
	'livechat/analytics/agents/average-service-time',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsAgentsAverageServiceTimeProps,
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { start, end } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const { agents, total } = await findAllAverageServiceTimeAsync({
				start: startDate,
				end: endDate,
				options: { offset, count },
			});
			return API.v1.success({
				agents,
				count: agents.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/agents/total-service-time',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsAgentsTotalServiceTimeProps,
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { start, end } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const { agents, total } = await findAllServiceTimeAsync({
				start: startDate,
				end: endDate,
				options: { offset, count },
			});
			return API.v1.success({
				agents,
				count: agents.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/agents/available-for-service-history',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsAgentsAvailableForServiceHistoryProps,
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { start, end } = this.queryParams;
			const { fullReport } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}

			const { agents, total } = await findAvailableServiceTimeHistoryAsync({
				start,
				end,
				fullReport: fullReport === 'true',
				options: { offset, count },
			});
			return API.v1.success({
				agents,
				count: agents.length,
				offset,
				total,
			});
		},
	},
);
