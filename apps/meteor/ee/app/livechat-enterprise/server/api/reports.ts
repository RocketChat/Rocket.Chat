import { isGETDashboardConversationsByType } from '@rocket.chat/rest-typings';

import {
	findAllConversationsBySource,
	findAllConversationsByStatus,
	findAllConversationsByDepartment,
	findAllConversationsByTags,
	findAllConversationsByAgents,
} from './lib/dashboards';

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
			const defaultValue = { data: [] };
			return API.v1.success(result || defaultValue);
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

			const defaultValue = { data: [] };
			return API.v1.success(result || defaultValue);
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

			const defaultValue = { data: [] };
			return API.v1.success(result || defaultValue);
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

			const defaultValue = { data: [] };
			return API.v1.success(result || defaultValue);
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

			const defaultValue = { data: [] };
			return API.v1.success(result || defaultValue);
		},
	},
);
