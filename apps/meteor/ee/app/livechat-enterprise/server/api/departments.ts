import { Match, check } from 'meteor/check';
import {
	isLivechatAnalyticsDepartmentsAmountOfChatsProps,
	isLivechatAnalyticsDepartmentsAverageServiceTimeProps,
	isLivechatAnalyticsDepartmentsAverageChatDurationTimeProps,
	isLivechatAnalyticsDepartmentsTotalServiceTimeProps,
	isLivechatAnalyticsDepartmentsAverageWaitingTimeProps,
	isLivechatAnalyticsDepartmentsTotalTransferredChatsProps,
	isLivechatAnalyticsDepartmentsTotalAbandonedChatsProps,
	isLivechatAnalyticsDepartmentsPercentageAbandonedChatsProps,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import {
	findAllRooms,
	findAllAverageServiceTime,
	findAllServiceTime,
	findAllAverageWaitingTime,
	findAllNumberOfTransferredRooms,
	findAllNumberOfAbandonedRooms,
	findPercentageOfAbandonedRooms,
	findAllAverageOfChatDurationTime,
} from '../../../../../app/livechat/server/lib/analytics/departments';

API.v1.addRoute(
	'livechat/analytics/departments/amount-of-chats',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isLivechatAnalyticsDepartmentsAmountOfChatsProps },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { start, end } = this.requestParams();
			const { answered, departmentId } = this.requestParams();

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const { departments, total } = findAllRooms({
				start: startDate,
				end: endDate,
				answered: answered && answered === 'true',
				departmentId,
				options: { offset, count },
			});
			return API.v1.success({
				departments,
				count: departments.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/departments/average-service-time',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsDepartmentsAverageServiceTimeProps,
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllAverageServiceTime({
				start: startDate,
				end: endDate,
				departmentId,
				options: { offset, count },
			});
			return API.v1.success({
				departments,
				count: departments.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/departments/average-chat-duration-time',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsDepartmentsAverageChatDurationTimeProps,
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllAverageOfChatDurationTime({
				start: startDate,
				end: endDate,
				departmentId,
				options: { offset, count },
			});
			return API.v1.success({
				departments,
				count: departments.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/departments/total-service-time',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsDepartmentsTotalServiceTimeProps,
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllServiceTime({
				start: startDate,
				end: endDate,
				departmentId,
				options: { offset, count },
			});
			return API.v1.success({
				departments,
				count: departments.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/departments/average-waiting-time',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsDepartmentsAverageWaitingTimeProps,
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllAverageWaitingTime({
				start: startDate,
				end: endDate,
				departmentId,
				options: { offset, count },
			});
			return API.v1.success({
				departments,
				count: departments.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/departments/total-transferred-chats',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsDepartmentsTotalTransferredChatsProps,
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllNumberOfTransferredRooms({
				start: startDate,
				end: endDate,
				departmentId,
				options: { offset, count },
			});
			return API.v1.success({
				departments,
				count: departments.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/departments/total-abandoned-chats',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsDepartmentsTotalAbandonedChatsProps,
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllNumberOfAbandonedRooms({
				start: startDate,
				end: endDate,
				departmentId,
				options: { offset, count },
			});
			return API.v1.success({
				departments,
				count: departments.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/analytics/departments/percentage-abandoned-chats',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsDepartmentsPercentageAbandonedChatsProps,
	},
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findPercentageOfAbandonedRooms({
				start: startDate,
				end: endDate,
				departmentId,
				options: { offset, count },
			});
			return API.v1.success({
				departments,
				count: departments.length,
				offset,
				total,
			});
		},
	},
);
