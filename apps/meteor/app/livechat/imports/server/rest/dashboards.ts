import { Users } from '@rocket.chat/models';
import {
	isGETDashboardTotalizerParams,
	isGETDashboardsAgentStatusParams,
	isGETDashboardConversationsByType,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import {
	findAllChatsStatusAsync,
	getProductivityMetricsAsync,
	getConversationsMetricsAsync,
	findAllChatMetricsByAgentAsync,
	findAllAgentsStatusAsync,
	findAllChatMetricsByDepartmentAsync,
	findAllResponseTimeMetricsAsync,
	getAgentsProductivityMetricsAsync,
	getChatsMetricsAsync,
	findAllConversationsBySource,
	findAllConversationsByStatus,
	findAllConversationsByDepartment,
	findAllConversationsByTags,
	findAllConversationsByAgents,
} from '../../../server/lib/analytics/dashboards';

API.v1.addRoute(
	'livechat/analytics/dashboards/conversation-totalizers',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isGETDashboardTotalizerParams,
	},
	{
		async get() {
			const { start, end } = this.queryParams;
			const { departmentId } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const user = await Users.findOneById(this.userId, { projection: { utcOffset: 1, language: 1 } });
			if (!user) {
				return API.v1.failure('User not found');
			}

			const totalizers = await getConversationsMetricsAsync({ start: startDate, end: endDate, departmentId, user });
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/agents-productivity-totalizers',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.queryParams;
			const { departmentId } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const user = await Users.findOneById(this.userId, { projection: { utcOffset: 1, language: 1 } });
			if (!user) {
				return API.v1.failure('User not found');
			}

			const totalizers = await getAgentsProductivityMetricsAsync({ start: startDate, end: endDate, departmentId, user });
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/chats-totalizers',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.queryParams;
			const { departmentId } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const totalizers = await getChatsMetricsAsync({ start: startDate, end: endDate, departmentId });
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/productivity-totalizers',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.queryParams;
			const { departmentId } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const user = await Users.findOneById(this.userId, { projection: { utcOffset: 1, language: 1 } });
			if (!user) {
				return API.v1.failure('User not found');
			}

			const totalizers = await getProductivityMetricsAsync({ start: startDate, end: endDate, departmentId, user });

			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.queryParams;
			const { departmentId } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const result = await findAllChatsStatusAsync({ start: startDate, end: endDate, departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats-per-agent',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.queryParams;
			const { departmentId } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);
			const result = (await findAllChatMetricsByAgentAsync({ start: startDate, end: endDate, departmentId })) as {
				[k: string]: { open: number; closed: number; onhold: number };
			};

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/agents-status',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardsAgentStatusParams },
	{
		async get() {
			const { departmentId } = this.queryParams;

			const result = await findAllAgentsStatusAsync({ departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats-per-department',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.queryParams;
			const { departmentId } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const result = (await findAllChatMetricsByDepartmentAsync({ start: startDate, end: endDate, departmentId })) as {
				[k: string]: { open: number; closed: number };
			};

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/timings',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.queryParams;
			const { departmentId } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const result = await findAllResponseTimeMetricsAsync({ start: startDate, end: endDate, departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/conversations-by-source',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardConversationsByType },
	{
		async get() {
			const { start, end } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}

			const startDate = new Date(start);
			const endDate = new Date(end);

			const result = await findAllConversationsBySource({ start: startDate, end: endDate });

			// Agg when no match returns empty, so we return a default value on that case
			return API.v1.success({ data: result || { open: 0, closed: 0, queued: 0 } });
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/conversations-by-status',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardConversationsByType },
	{
		async get() {
			const { start, end } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}

			const startDate = new Date(start);
			const endDate = new Date(end);

			const result = await findAllConversationsByStatus({ start: startDate, end: endDate });

			return API.v1.success({ data: result || {} });
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/conversations-by-department',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardConversationsByType },
	{
		async get() {
			const { start, end } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}

			const startDate = new Date(start);
			const endDate = new Date(end);

			const result = await findAllConversationsByDepartment({ start: startDate, end: endDate });

			return API.v1.success({ data: result || {} });
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/conversations-by-tags',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardConversationsByType },
	{
		async get() {
			const { start, end } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}

			const startDate = new Date(start);
			const endDate = new Date(end);

			const result = await findAllConversationsByTags({ start: startDate, end: endDate });

			return API.v1.success({ data: result || {} });
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/conversations-by-agent',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardConversationsByType },
	{
		async get() {
			const { start, end } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}

			const startDate = new Date(start);
			const endDate = new Date(end);

			const result = await findAllConversationsByAgents({ start: startDate, end: endDate });

			return API.v1.success({ data: result || {} });
		},
	},
);
