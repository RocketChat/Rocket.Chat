import { isGETDashboardConversationsByType } from '@rocket.chat/rest-typings';
import { isValid, startOfDay, differenceInYears, isAfter } from 'date-fns';

import {
	findAllConversationsBySourceCached,
	findAllConversationsByStatusCached,
	findAllConversationsByDepartmentCached,
	findAllConversationsByTagsCached,
	findAllConversationsByAgentsCached,
} from './lib/dashboards';
import { API } from '../../../../../app/api/server';
import { restrictQuery } from '../lib/restrictQuery';

const parseDate = (input: string): Date => {
	const d = new Date(input);
	if (!isValid(d)) {
		throw new Error('The date query parameter must be a valid date.');
	}
	return d;
};

const checkDates = (start: Date, end: Date) => {
	if (!isValid(start)) {
		throw new Error('The "start" query parameter must be a valid date.');
	}
	if (!isValid(end)) {
		throw new Error('The "end" query parameter must be a valid date.');
	}
	if (differenceInYears(startOfDay(end), startOfDay(start)) > 1.01) {
		throw new Error('The "start" and "end" query parameters must be less than 1 year apart.');
	}
	if (isAfter(start, end)) {
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

			const startDate = parseDate(start);
			const endDate = parseDate(end);

			checkDates(startDate, endDate);

			const extraQuery = await restrictQuery({ userId: this.userId });
			const result = await findAllConversationsBySourceCached({ start: startDate, end: endDate, extraQuery });

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

			const startDate = parseDate(start);
			const endDate = parseDate(end);

			checkDates(startDate, endDate);
			const extraQuery = await restrictQuery({ userId: this.userId });
			const result = await findAllConversationsByStatusCached({ start: startDate, end: endDate, extraQuery });

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

			const startDate = parseDate(start);
			const endDate = parseDate(end);

			checkDates(startDate, endDate);
			const extraQuery = await restrictQuery({ userId: this.userId });
			const result = await findAllConversationsByDepartmentCached({ start: startDate, end: endDate, sort, extraQuery });

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

			const startDate = parseDate(start);
			const endDate = parseDate(end);

			checkDates(startDate, endDate);
			const extraQuery = await restrictQuery({ userId: this.userId });
			const result = await findAllConversationsByTagsCached({ start: startDate, end: endDate, sort, extraQuery });

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

			const startDate = parseDate(start);
			const endDate = parseDate(end);

			checkDates(startDate, endDate);
			const extraQuery = await restrictQuery({ userId: this.userId });
			const result = await findAllConversationsByAgentsCached({ start: startDate, end: endDate, sort, extraQuery });

			return API.v1.success(result);
		},
	},
);
