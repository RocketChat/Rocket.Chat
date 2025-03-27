import { isGETDashboardConversationsByType } from '@rocket.chat/rest-typings';
import type { Moment } from 'moment';
import moment from 'moment';

import {
	findAllConversationsBySourceCached,
	findAllConversationsByStatusCached,
	findAllConversationsByDepartmentCached,
	findAllConversationsByTagsCached,
	findAllConversationsByAgentsCached,
} from './lib/dashboards';
import { API } from '../../../../../app/api/server';
import { restrictQuery } from '../lib/restrictQuery';

const checkDates = (start: Moment, end: Moment) => {
	if (!start.isValid()) {
		throw new Error('The "start" query parameter must be a valid date.');
	}
	if (!end.isValid()) {
		throw new Error('The "end" query parameter must be a valid date.');
	}
	// Check dates are no more than 1 year apart using moment
	// 1.01 === "we allow to pass year by some hours/days"
	if (moment(end).startOf('day').diff(moment(start).startOf('day'), 'year', true) > 1.01) {
		throw new Error('The "start" and "end" query parameters must be less than 1 year apart.');
	}

	if (start.isAfter(end)) {
		throw new Error('The "start" query parameter must be before the "end" query parameter.');
	}
};

API.v1.addRoute(
	'livechat/analytics/dashboards/conversations-by-source',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-reports'],
		validateParams: isGETDashboardConversationsByType,
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { start, end } = this.queryParams;

			const startDate = moment(start);
			const endDate = moment(end);

			checkDates(startDate, endDate);

			const extraQuery = await restrictQuery();
			const result = await findAllConversationsBySourceCached({ start: startDate.toDate(), end: endDate.toDate(), extraQuery });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/conversations-by-status',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-reports'],
		validateParams: isGETDashboardConversationsByType,
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { start, end } = this.queryParams;

			const startDate = moment(start);
			const endDate = moment(end);

			checkDates(startDate, endDate);
			const extraQuery = await restrictQuery();
			const result = await findAllConversationsByStatusCached({ start: startDate.toDate(), end: endDate.toDate(), extraQuery });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/conversations-by-department',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-reports'],
		validateParams: isGETDashboardConversationsByType,
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { start, end } = this.queryParams;
			const { sort } = await this.parseJsonQuery();

			const startDate = moment(start);
			const endDate = moment(end);

			checkDates(startDate, endDate);
			const extraQuery = await restrictQuery();
			const result = await findAllConversationsByDepartmentCached({ start: startDate.toDate(), end: endDate.toDate(), sort, extraQuery });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/conversations-by-tags',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-reports'],
		validateParams: isGETDashboardConversationsByType,
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { start, end } = this.queryParams;
			const { sort } = await this.parseJsonQuery();

			const startDate = moment(start);
			const endDate = moment(end);

			checkDates(startDate, endDate);
			const extraQuery = await restrictQuery();
			const result = await findAllConversationsByTagsCached({ start: startDate.toDate(), end: endDate.toDate(), sort, extraQuery });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/dashboards/conversations-by-agent',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-reports'],
		validateParams: isGETDashboardConversationsByType,
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { start, end } = this.queryParams;
			const { sort } = await this.parseJsonQuery();

			const startDate = moment(start);
			const endDate = moment(end);

			checkDates(startDate, endDate);
			const extraQuery = await restrictQuery();
			const result = await findAllConversationsByAgentsCached({ start: startDate.toDate(), end: endDate.toDate(), sort, extraQuery });

			return API.v1.success(result);
		},
	},
);
