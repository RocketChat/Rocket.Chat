import type { IAuditLog, IMessage, IUser, IRoom } from '@rocket.chat/core-typings';
import { Rooms, AuditLog, ServerEvents } from '@rocket.chat/models';
import { isServerEventsAuditSettingsProps, ajv, ajvQuery } from '@rocket.chat/rest-typings';
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';
import { convertSubObjectsIntoPaths } from '@rocket.chat/tools';

import { API } from '../../../app/api/server/api';
import { getPaginationItems } from '../../../app/api/server/helpers/getPaginationItems';
import { findUsersOfRoom } from '../../../server/lib/findUsersOfRoom';
import { auditGetAuditionsMethod, auditGetMessagesMethod, auditGetOmnichannelMessagesMethod } from '../lib/audit/functions';

type AuditRoomMembersParams = PaginatedRequest<{
	roomId: string;
	filter: string;
}>;

const auditRoomMembersSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string', minLength: 1 },
		filter: { type: 'string' },
		count: { type: 'number' },
		offset: { type: 'number' },
		sort: { type: 'string' },
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isAuditRoomMembersProps = ajvQuery.compile<AuditRoomMembersParams>(auditRoomMembersSchema);

type AuditAuditionsParams = { startDate: string; endDate: string };

const auditAuditionsSchema = {
	type: 'object',
	properties: {
		startDate: { type: 'string', minLength: 1 },
		endDate: { type: 'string', minLength: 1 },
	},
	required: ['startDate', 'endDate'],
	additionalProperties: false,
};

const isAuditAuditionsProps = ajvQuery.compile<AuditAuditionsParams>(auditAuditionsSchema);

type AuditMessagesPayload = {
	rid?: string;
	startDate: string;
	endDate: string;
	users: string[];
	msg: string;
	type: string;
	visitor?: string;
	agent?: string;
};

const auditMessagesSchema = {
	type: 'object',
	properties: {
		rid: { type: 'string' },
		startDate: { type: 'string', minLength: 1 },
		endDate: { type: 'string', minLength: 1 },
		users: { type: 'array', items: { type: 'string' } },
		msg: { type: 'string' },
		type: { type: 'string' },
		visitor: { type: 'string' },
		agent: { type: 'string' },
	},
	required: ['startDate', 'endDate', 'users', 'msg', 'type'],
	additionalProperties: false,
};

const isAuditMessagesProps = ajv.compile<AuditMessagesPayload>(auditMessagesSchema);

type AuditOmnichannelMessagesPayload = {
	startDate: string;
	endDate: string;
	users: string[];
	msg: string;
	type: string;
	visitor?: string;
	agent?: string;
};

const auditOmnichannelMessagesSchema = {
	type: 'object',
	properties: {
		startDate: { type: 'string', minLength: 1 },
		endDate: { type: 'string', minLength: 1 },
		users: { type: 'array', items: { type: 'string' } },
		msg: { type: 'string' },
		type: { type: 'string' },
		visitor: { type: 'string' },
		agent: { type: 'string' },
	},
	required: ['startDate', 'endDate', 'users', 'msg', 'type'],
	additionalProperties: false,
};

const isAuditOmnichannelMessagesProps = ajv.compile<AuditOmnichannelMessagesPayload>(auditOmnichannelMessagesSchema);

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/audit/rooms.members': {
			GET: (
				params: AuditRoomMembersParams,
			) => PaginatedResult<{ members: Pick<IUser, '_id' | 'name' | 'username' | 'status' | '_updatedAt'>[] }>;
		};

		'/v1/audit.auditions': {
			GET: (params: AuditAuditionsParams) => { auditions: IAuditLog[] };
		};

		'/v1/audit.messages': {
			POST: (params: AuditMessagesPayload) => { messages: IMessage[] };
		};

		'/v1/audit.omnichannel.messages': {
			POST: (params: AuditOmnichannelMessagesPayload) => { messages: IMessage[] };
		};
	}
}

const parseDateOrFail = (value: string, name: string): Date => {
	const ts = Date.parse(value);
	if (Number.isNaN(ts)) {
		throw new Error(`The "${name}" parameter must be a valid date.`);
	}
	return new Date(ts);
};

API.v1.addRoute(
	'audit/rooms.members',
	{
		authRequired: true,
		permissionsRequired: ['view-members-list-all-rooms'],
		validateParams: isAuditRoomMembersProps,
		license: ['auditing'],
	},
	{
		async get() {
			const { roomId, filter } = this.queryParams;
			const { count: limit, offset: skip } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const room = await Rooms.findOneById<Pick<IRoom, '_id' | 'name' | 'fname'>>(roomId, { projection: { _id: 1, name: 1, fname: 1 } });
			if (!room) {
				return API.v1.notFound();
			}

			const { cursor, totalCount } = findUsersOfRoom({
				rid: room._id,
				filter,
				skip,
				limit,
				...(sort?.username && { sort: { username: sort.username } }),
			});

			const [members, total] = await Promise.all([cursor.toArray(), totalCount]);

			await AuditLog.insertOne({
				ts: new Date(),
				results: total,
				u: {
					_id: this.user._id,
					username: this.user.username,
					name: this.user.name,
					...(this.user.avatarETag && { avatarETag: this.user.avatarETag }),
				},
				fields: {
					msg: 'Room_members_list',
					rids: [room._id],
					type: 'room_member_list',
					room: room.name || room.fname,
					filters: filter,
				},
			});

			return API.v1.success({
				members,
				count: members.length,
				offset: skip,
				total,
			});
		},
	},
);

API.v1.get(
	'audit.settings',
	{
		response: {
			200: ajv.compile({
				additionalProperties: false,
				type: 'object',
				properties: {
					events: {
						type: 'array',
						items: {
							type: 'object',
						},
					},
					count: {
						type: 'number',
						description: 'The number of events returned in this response.',
					},
					offset: {
						type: 'number',
						description: 'The number of events that were skipped in this response.',
					},
					total: {
						type: 'number',
						description: 'The total number of events that match the query.',
					},
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['events', 'count', 'offset', 'total', 'success'],
			}),
			400: ajv.compile({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [false],
					},
					error: {
						type: 'string',
					},
					errorType: {
						type: 'string',
					},
				},
				required: ['success', 'error'],
			}),
		},
		query: isServerEventsAuditSettingsProps,
		authRequired: true,
		permissionsRequired: ['can-audit'],
		license: ['auditing'],
	},
	async function action() {
		const { start, end, settingId, actor } = this.queryParams;

		if (start && isNaN(Date.parse(start))) {
			return API.v1.failure('The "start" query parameter must be a valid date.');
		}

		if (end && isNaN(Date.parse(end))) {
			return API.v1.failure('The "end" query parameter must be a valid date.');
		}

		const { offset, count } = await getPaginationItems(this.queryParams as Record<string, string | number | null | undefined>);
		const { sort } = await this.parseJsonQuery();
		const _sort = { ts: sort?.ts ? sort?.ts : -1 };

		const { cursor, totalCount } = ServerEvents.findPaginated(
			{
				...(settingId && { 'data.key': 'id', 'data.value': settingId }),
				...(actor && convertSubObjectsIntoPaths({ actor })),
				ts: {
					$gte: start ? new Date(start) : new Date(0),
					$lte: end ? new Date(end) : new Date(),
				},
				t: 'settings.changed',
			},
			{
				sort: _sort,
				skip: offset,
				limit: count,
				allowDiskUse: true,
			},
		);

		const [events, total] = await Promise.all([cursor.toArray(), totalCount]);

		return API.v1.success({
			events,
			count: events.length,
			offset,
			total,
		});
	},
);

const auditAuditionsResponseSchema = ajv.compile<{ auditions: IAuditLog[] }>({
	type: 'object',
	properties: {
		auditions: { type: 'array', items: { type: 'object' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['auditions', 'success'],
	additionalProperties: false,
});

const auditMessagesResponseSchema = ajv.compile<{ messages: IMessage[] }>({
	type: 'object',
	properties: {
		messages: { type: 'array', items: { type: 'object' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['messages', 'success'],
	additionalProperties: false,
});

const auditErrorResponseSchema = ajv.compile({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [false] },
		error: { type: 'string' },
		errorType: { type: 'string' },
	},
	required: ['success', 'error'],
});

API.v1.get(
	'audit.auditions',
	{
		authRequired: true,
		permissionsRequired: ['can-audit-log'],
		query: isAuditAuditionsProps,
		license: ['auditing'],
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: {
			200: auditAuditionsResponseSchema,
			400: auditErrorResponseSchema,
		},
	},
	async function action() {
		const startDate = parseDateOrFail(this.queryParams.startDate, 'startDate');
		const endDate = parseDateOrFail(this.queryParams.endDate, 'endDate');

		const auditions = await auditGetAuditionsMethod(this.userId, startDate, endDate);
		return API.v1.success({ auditions });
	},
);

API.v1.post(
	'audit.messages',
	{
		authRequired: true,
		permissionsRequired: ['can-audit'],
		body: isAuditMessagesProps,
		license: ['auditing'],
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: {
			200: auditMessagesResponseSchema,
			400: auditErrorResponseSchema,
		},
	},
	async function action() {
		const { rid, users, msg, type, visitor, agent } = this.bodyParams;
		const startDate = parseDateOrFail(this.bodyParams.startDate, 'startDate');
		const endDate = parseDateOrFail(this.bodyParams.endDate, 'endDate');

		const messages = await auditGetMessagesMethod(this.userId, {
			rid,
			startDate,
			endDate,
			users,
			msg,
			type,
			visitor,
			agent,
		});

		return API.v1.success({ messages });
	},
);

API.v1.post(
	'audit.omnichannel.messages',
	{
		authRequired: true,
		permissionsRequired: ['can-audit'],
		body: isAuditOmnichannelMessagesProps,
		license: ['auditing'],
		rateLimiterOptions: { numRequestsAllowed: 10, intervalTimeInMS: 60000 },
		response: {
			200: auditMessagesResponseSchema,
			400: auditErrorResponseSchema,
		},
	},
	async function action() {
		const { users, msg, type, visitor, agent } = this.bodyParams;
		const startDate = parseDateOrFail(this.bodyParams.startDate, 'startDate');
		const endDate = parseDateOrFail(this.bodyParams.endDate, 'endDate');

		const messages = await auditGetOmnichannelMessagesMethod(this.userId, {
			startDate,
			endDate,
			users,
			msg,
			type,
			visitor,
			agent,
		});

		return API.v1.success({ messages });
	},
);
