import { Match, check } from 'meteor/check';
import { OperationResult } from '@rocket.chat/rest-typings';
import { IAgentProductivityTotalizers, IConversationTotalizers, IChatTotalizers, IProductivityTotalizers } from '@rocket.chat/core-typings';

import { API } from '../../../../api/server';
import { hasPermission } from '../../../../authorization/server';
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
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

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
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

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
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

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
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

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
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

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
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const result = findAllChatMetricsByAgent({ start: startDate, end: endDate, departmentId }) as OperationResult<
				'GET',
				'livechat/analytics/dashboards/charts/chats-per-agent'
			>;

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/agents-status',
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}

			const { departmentId } = this.requestParams();

			const result = findAllAgentsStatus({ departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats-per-department',
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const result = findAllChatMetricsByDepartment({ start: startDate, end: endDate, departmentId }) as OperationResult<
				'GET',
				'livechat/analytics/dashboards/charts/chats-per-department'
			>;

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/timings',
	{ authRequired: true },
	{
		async get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

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
