import { isGETDashboardTotalizerParams, isGETDashboardsAgentStatusParams } from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import {
	findAllChatsStatus,
	getProductivityMetrics,
	getConversationsMetrics,
	findAllChatMetricsByAgent,
	findAllAgentsStatus,
	findAllChatMetricsByDepartment,
	findAllResponseTimeMetrics,
	getAgentsProductivityMetrics,
	getChatsMetrics,
} from '../../../server/lib/analytics/dashboards';
import { Users } from '../../../../models/server';

API.v1.addRoute(
	'livechat/analytics/dashboards/conversation-totalizers',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isGETDashboardTotalizerParams,
	},
	{
		async get() {
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const user = Users.findOneById(this.userId, { fields: { utcOffset: 1, language: 1 } });

			// @ts-expect-error TODO: fix this
			const totalizers = getConversationsMetrics({ start: startDate, end: endDate, departmentId, user });
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/agents-productivity-totalizers',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const user = Users.findOneById(this.userId, { fields: { utcOffset: 1, language: 1 } });

			// @ts-expect-error TODO: fix this
			const totalizers = getAgentsProductivityMetrics({ start: startDate, end: endDate, departmentId, user });
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/chats-totalizers',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			// @ts-expect-error TODO: fix this
			const totalizers = getChatsMetrics({ start: startDate, end: endDate, departmentId });
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/productivity-totalizers',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const user = Users.findOneById(this.userId, { fields: { utcOffset: 1, language: 1 } });

			// @ts-expect-error TODO: fix this
			const totalizers = getProductivityMetrics({ start: startDate, end: endDate, departmentId, user });

			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			// @ts-expect-error TODO: fix this
			const result = findAllChatsStatus({ start: startDate, end: endDate, departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats-per-agent',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);
			// @ts-expect-error TODO: fix this
			const result = findAllChatMetricsByAgent({ start: startDate, end: endDate, departmentId }) as {
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
			const { departmentId } = this.requestParams();

			// @ts-expect-error TODO: fix this
			const result = findAllAgentsStatus({ departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats-per-department',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETDashboardTotalizerParams },
	{
		async get() {
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			// @ts-expect-error TODO: fix this
			const result = findAllChatMetricsByDepartment({ start: startDate, end: endDate, departmentId }) as {
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
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			// @ts-expect-error TODO: fix this
			const result = findAllResponseTimeMetrics({ start: startDate, end: endDate, departmentId });

			return API.v1.success(result);
		},
	},
);
