import {
	isLivechatAnalyticsAgentsTotalServiceTimeProps,
	isLivechatAnalyticsAgentsAverageServiceTimeProps,
	isLivechatAnalyticsAgentsAvailableForServiceHistoryProps,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import {
	findAllAverageServiceTime,
	findAllServiceTime,
	findAvailableServiceTimeHistory,
} from '../../../../../app/livechat/server/lib/analytics/agents';

API.v1.addRoute(
	'livechat/analytics/agents/average-service-time',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isLivechatAnalyticsAgentsAverageServiceTimeProps },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { start, end } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const { agents, total } = findAllAverageServiceTime({
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
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isLivechatAnalyticsAgentsTotalServiceTimeProps },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { start, end } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const { agents, total } = findAllServiceTime({
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
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { start, end } = this.requestParams();
			const { fullReport } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const { agents, total } = findAvailableServiceTimeHistory({
				start: startDate,
				end: endDate,
				fullReport: fullReport && fullReport === 'true',
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
