import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Rooms, AuditLog } from '@rocket.chat/models';
import type { PaginatedRequest, PaginatedResult } from '@rocket.chat/rest-typings';
import Ajv from 'ajv';

import { API } from '../../../app/api/server/api';
import { getPaginationItems } from '../../../app/api/server/helpers/getPaginationItems';
import { findUsersOfRoom } from '../../../server/lib/findUsersOfRoom';

const ajv = new Ajv({
	coerceTypes: true,
});

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

export const isAuditRoomMembersProps = ajv.compile<AuditRoomMembersParams>(auditRoomMembersSchema);

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
