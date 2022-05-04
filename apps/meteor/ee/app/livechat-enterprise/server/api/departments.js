import { Match, check } from 'meteor/check';

import { API } from '../../../../../app/api/server';
import { hasPermission } from '../../../../../app/authorization/server';
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
import { findAllDepartmentsAvailable, findAllDepartmentsByUnit } from '../lib/Department';

API.v1.addRoute(
	'livechat/analytics/departments/amount-of-chats',
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
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
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
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
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
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
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
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
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
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
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
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
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
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
	{ authRequired: true },
	{
		get() {
			if (!hasPermission(this.userId, 'view-livechat-manager')) {
				return API.v1.unauthorized();
			}
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

API.v1.addRoute(
	'livechat/departments.available-by-unit/:unitId',
	{ authRequired: true },
	{
		get() {
			check(this.urlParams, {
				unitId: Match.Maybe(String),
			});
			const { offset, count } = this.getPaginationItems();
			const { unitId } = this.urlParams;
			const { text, onlyMyDepartments } = this.queryParams;

			const { departments, total } = Promise.await(
				findAllDepartmentsAvailable(this.userId, unitId, offset, count, text, onlyMyDepartments === 'true'),
			);

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
	'livechat/departments.by-unit/:id',
	{ authRequired: true },
	{
		async get() {
			check(this.urlParams, {
				id: String,
			});
			const { offset, count } = this.getPaginationItems();
			const { id } = this.urlParams;

			const { departments, total } = await findAllDepartmentsByUnit(id, offset, count);

			return API.v1.success({
				departments,
				count: departments.length,
				offset,
				total,
			});
		},
	},
);
