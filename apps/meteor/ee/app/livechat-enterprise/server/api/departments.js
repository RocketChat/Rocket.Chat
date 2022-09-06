import { Match, check } from 'meteor/check';

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
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			let { start, end } = this.requestParams();
			const { answered, departmentId } = this.requestParams();

			check(start, String);
			check(end, String);
			check(answered, Match.Maybe(String));
			check(departmentId, Match.Maybe(String));

			if (isNaN(Date.parse(start))) {
				return API.v1.failure('The "start" query parameter must be a valid date.');
			}
			start = new Date(start);

			if (isNaN(Date.parse(end))) {
				return API.v1.failure('The "end" query parameter must be a valid date.');
			}
			end = new Date(end);

			const { departments, total } = findAllRooms({
				start,
				end,
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
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllAverageServiceTime({
				start,
				end,
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
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllAverageOfChatDurationTime({
				start,
				end,
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
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllServiceTime({
				start,
				end,
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
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllAverageWaitingTime({
				start,
				end,
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
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllNumberOfTransferredRooms({
				start,
				end,
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
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findAllNumberOfAbandonedRooms({
				start,
				end,
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
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
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

			const { departments, total } = findPercentageOfAbandonedRooms({
				start,
				end,
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
