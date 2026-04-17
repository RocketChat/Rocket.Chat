import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Rooms, AuditLog, ServerEvents } from '@rocket.chat/models';
import {
	isServerEventsAuditSettingsProps,
	ajv,
	ajvQuery,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';
import { convertSubObjectsIntoPaths } from '@rocket.chat/tools';

import { API } from '../../../app/api/server/api';
import { getPaginationItems } from '../../../app/api/server/helpers/getPaginationItems';
import { findUsersOfRoom } from '../../../server/lib/findUsersOfRoom';

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

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/audit/rooms.members': {
			GET: (
				params: AuditRoomMembersParams,
			) => PaginatedResult<{ members: Pick<IUser, '_id' | 'name' | 'username' | 'status' | '_updatedAt'>[] }>;
		};
	}
}

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

const auditSettingsResponseSchema = ajv.compile({
	additionalProperties: false,
	type: 'object',
	properties: {
		events: {
			type: 'array',
			items: {
				type: 'object',
				description: 'A setting-change audit event: who changed which setting, when, and the previous/current values.',
				properties: {
					_id: { type: 'string' },
					t: {
						type: 'string',
						enum: ['settings.changed'],
						description: 'Event type. Always `settings.changed` for this endpoint.',
					},
					ts: { type: 'string', format: 'date-time' },
					actor: {
						type: 'object',
						description: 'Who performed the change. May be a user, an app, or the system.',
						properties: {
							type: { type: 'string', enum: ['user', 'app', 'system'] },
							_id: { type: 'string' },
							username: { type: 'string' },
							ip: { type: 'string' },
							useragent: { type: 'string' },
							reason: { type: 'string' },
						},
						required: ['type'],
					},
					data: {
						type: 'array',
						description:
							'Key/value pairs describing the change. For `settings.changed` events the keys are `id` (setting id), `previous` (prior value) and `current` (new value).',
						items: {
							type: 'object',
							properties: {
								key: { type: 'string', enum: ['id', 'previous', 'current'] },
								value: {},
							},
							required: ['key'],
						},
					},
				},
				required: ['_id', 't', 'ts'],
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
});

API.v1.get(
	'audit.settings',
	{
		response: {
			200: auditSettingsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
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
