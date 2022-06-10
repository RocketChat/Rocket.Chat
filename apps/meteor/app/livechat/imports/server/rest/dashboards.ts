import { IAgentProductivityTotalizers, IConversationTotalizers, IChatTotalizers, IProductivityTotalizers } from '@rocket.chat/core-typings';
import { isLivechatAnalyticsDashboardGenericSchema, isLivechatAnalyticsChartsAgentStatusSchema } from '@rocket.chat/rest-typings';

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

type ChatsPerDepartmentResponse = {
	[departmentName: string]: {
		open: number;
		closed: number;
	};
};

type ChatsPerAgentResponse = {
	[agentId: string]: {
		open: number;
		closed: number;
		onhold: number;
	};
};

API.v1.addRoute(
	'livechat/analytics/dashboards/conversation-totalizers',
	{ authRequired: true, validateParams: isLivechatAnalyticsDashboardGenericSchema, permissionsRequired: ['view-livechat-manager'] },
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

			const totalizers = getConversationsMetrics({ start: startDate, end: endDate, departmentId, user }) as IConversationTotalizers;
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/agents-productivity-totalizers',
	{ authRequired: true, validateParams: isLivechatAnalyticsDashboardGenericSchema, permissionsRequired: ['view-livechat-manager'] },
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

			const totalizers = getAgentsProductivityMetrics({
				start: startDate,
				end: endDate,
				departmentId,
				user,
			}) as IAgentProductivityTotalizers;
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/chats-totalizers',
	{ authRequired: true, validateParams: isLivechatAnalyticsDashboardGenericSchema, permissionsRequired: ['view-livechat-manager'] },
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

			const totalizers = getChatsMetrics({ start: startDate, end: endDate, departmentId }) as IChatTotalizers;
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/productivity-totalizers',
	{ authRequired: true, validateParams: isLivechatAnalyticsDashboardGenericSchema, permissionsRequired: ['view-livechat-manager'] },
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

			const totalizers = getProductivityMetrics({ start: startDate, end: endDate, departmentId, user }) as IProductivityTotalizers;

			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats',
	{ authRequired: true, validateParams: isLivechatAnalyticsDashboardGenericSchema, permissionsRequired: ['view-livechat-manager'] },
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

			const result = findAllChatsStatus({ start: startDate, end: endDate, departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats-per-agent',
	{ authRequired: true, validateParams: isLivechatAnalyticsDashboardGenericSchema, permissionsRequired: ['view-livechat-manager'] },
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

			const result = findAllChatMetricsByAgent({ start: startDate, end: endDate, departmentId }) as ChatsPerAgentResponse;

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/agents-status',
	{ authRequired: true, validateParams: isLivechatAnalyticsChartsAgentStatusSchema, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const { departmentId } = this.requestParams();

			const result = findAllAgentsStatus({ departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats-per-department',
	{ authRequired: true, validateParams: isLivechatAnalyticsDashboardGenericSchema, permissionsRequired: ['view-livechat-manager'] },
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

			const result = findAllChatMetricsByDepartment({ start: startDate, end: endDate, departmentId }) as ChatsPerDepartmentResponse;

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/timings',
	{ authRequired: true, validateParams: isLivechatAnalyticsDashboardGenericSchema, permissionsRequired: ['view-livechat-manager'] },
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

			const result = findAllResponseTimeMetrics({ start: startDate, end: endDate, departmentId });

			return API.v1.success(result);
		},
	},
);
