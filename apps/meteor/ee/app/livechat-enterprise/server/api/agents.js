import { Match, check } from 'meteor/check';

import { API } from '../../../../../app/api/server';
import { hasPermission } from '../../../../../app/authorization/server';
import {
	findAllAverageServiceTime,
	findAllServiceTime,
	findAvailableServiceTimeHistory,
} from '../../../../../app/livechat/server/lib/analytics/agents';

API.v1.addRoute(
	'livechat/analytics/agents/average-service-time',
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { offset, count } = this.getPaginationItems();
			let { start, end } = this.requestParams();

			check(start, String);
			check(end, String);

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);

			const { agents, total } = findAllAverageServiceTime({
				start,
				end,
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
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { offset, count } = this.getPaginationItems();
			let { start, end } = this.requestParams();

			check(start, String);
			check(end, String);

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);

			const { agents, total } = findAllServiceTime({
				start,
				end,
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
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
			const { offset, count } = this.getPaginationItems();
			let { start, end } = this.requestParams();
			const { fullReport } = this.requestParams();

			check(start, String);
			check(end, String);
			check(fullReport, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);

			const { agents, total } = findAvailableServiceTimeHistory({
				start,
				end,
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
