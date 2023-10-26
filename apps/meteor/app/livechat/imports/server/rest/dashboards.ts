import { Users } from '@rocket.chat/models';
import { isGETDashboardTotalizerParams, isGETDashboardsAgentStatusParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import {
	getProductivityMetricsAsyncCached,
	getConversationsMetricsAsyncCached,
	getAgentsProductivityMetricsAsyncCached,
	getChatsMetricsAsyncCached,
	findAllChatsStatusAsyncCached,
	findAllChatMetricsByAgentAsyncCached,
	findAllAgentsStatusAsyncCached,
	findAllChatMetricsByDepartmentAsyncCached,
	findAllResponseTimeMetricsAsyncCached,
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

			const totalizers = await getConversationsMetricsAsyncCached({ start: startDate, end: endDate, departmentId, user });
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

			const totalizers = await getAgentsProductivityMetricsAsyncCached({ start: startDate, end: endDate, departmentId, user });
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

			const totalizers = await getChatsMetricsAsyncCached({ start: startDate, end: endDate, departmentId });
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

			const totalizers = await getProductivityMetricsAsyncCached({ start: startDate, end: endDate, departmentId, user });

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

			const result = await findAllChatsStatusAsyncCached({ start: startDate, end: endDate, departmentId });

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
			const result = (await findAllChatMetricsByAgentAsyncCached({ start: startDate, end: endDate, departmentId })) as {
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

			const result = await findAllAgentsStatusAsyncCached({ departmentId });

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

			const result = (await findAllChatMetricsByDepartmentAsyncCached({ start: startDate, end: endDate, departmentId })) as {
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

			const result = await findAllResponseTimeMetricsAsyncCached({ start: startDate, end: endDate, departmentId });

			return API.v1.success(result);
		},
	},
);
