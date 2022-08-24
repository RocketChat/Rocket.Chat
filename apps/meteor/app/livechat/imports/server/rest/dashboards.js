import { Match, check } from 'meteor/check';

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
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		get() {
			let { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);

			const user = Users.findOneById(this.userId, { fields: { utcOffset: 1, language: 1 } });

			const totalizers = getConversationsMetrics({ start, end, departmentId, user });
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/agents-productivity-totalizers',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		get() {
			let { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);

			const user = Users.findOneById(this.userId, { fields: { utcOffset: 1, language: 1 } });

			const totalizers = getAgentsProductivityMetrics({ start, end, departmentId, user });
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/chats-totalizers',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		get() {
			let { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);

			const totalizers = getChatsMetrics({ start, end, departmentId });
			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/productivity-totalizers',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		get() {
			let { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);

			const user = Users.findOneById(this.userId, { fields: { utcOffset: 1, language: 1 } });

			const totalizers = getProductivityMetrics({ start, end, departmentId, user });

			return API.v1.success(totalizers);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		get() {
			let { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);
			const result = findAllChatsStatus({ start, end, departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats-per-agent',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		get() {
			let { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);
			const result = findAllChatMetricsByAgent({ start, end, departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/agents-status',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		get() {
			const { departmentId } = this.requestParams();
			check(departmentId, Match.Maybe(String));

			const result = findAllAgentsStatus({ departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/chats-per-department',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		get() {
			let { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);
			const result = findAllChatMetricsByDepartment({ start, end, departmentId });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/charts/timings',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		get() {
			let { start, end } = this.requestParams();
			const { departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(departmentId, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);
			const result = findAllResponseTimeMetrics({ start, end, departmentId });

			return API.v1.success(result);
		},
	},
);
