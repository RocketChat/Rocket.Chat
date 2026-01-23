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
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import {
	findAllRoomsAsync,
	findAllAverageServiceTimeAsync,
	findAllServiceTimeAsync,
	findAllAverageWaitingTimeAsync,
	findAllNumberOfTransferredRoomsAsync,
	findAllNumberOfAbandonedRoomsAsync,
	findPercentageOfAbandonedRoomsAsync,
	findAllAverageOfChatDurationTimeAsync,
} from '../../../../../app/livechat/server/lib/analytics/departments';

API.v1.addRoute(
	'livechat/analytics/departments/amount-of-chats',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: isLivechatAnalyticsDepartmentsAmountOfChatsProps,
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { start, end } = this.queryParams;
			const { answered, departmentId } = this.queryParams;

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			const startDate = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			const endDate = new Date(end);

			const { departments, total } = await findAllRoomsAsync({
				start: startDate,
				end: endDate,
				answered: answered === 'true',
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
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
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

			const { departments, total } = await findAllAverageServiceTimeAsync({
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
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
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

			const { departments, total } = await findAllAverageOfChatDurationTimeAsync({
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
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
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

			const { departments, total } = await findAllServiceTimeAsync({
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
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
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

			const { departments, total } = await findAllAverageWaitingTimeAsync({
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
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
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

			const { departments, total } = await findAllNumberOfTransferredRoomsAsync({
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
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
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

			const { departments, total } = await findAllNumberOfAbandonedRoomsAsync({
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
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
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

			const { departments, total } = await findPercentageOfAbandonedRoomsAsync({
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
