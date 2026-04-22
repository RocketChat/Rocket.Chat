import { Team } from '@rocket.chat/core-services';
import type { ITeamAutocompleteResult } from '@rocket.chat/core-services';
import type { ITeam } from '@rocket.chat/core-typings';
import { Users, Rooms } from '@rocket.chat/models';
import {
	ajv,
	isTeamsAddRoomsProps,
	isTeamsAutocompleteProps,
	isTeamsConvertToChannelProps,
	isTeamsCreateProps,
	isTeamsInfoProps,
	isTeamsListRoomsProps,
	isTeamsListRoomsOfUserProps,
	isTeamsMembersProps,
	isTeamsRemoveRoomProps,
	isTeamsUpdateMemberProps,
	isTeamsUpdateRoomProps,
	isTeamsRemoveMemberProps,
	isTeamsAddMembersProps,
	isTeamsDeleteProps,
	isTeamsLeaveProps,
	isTeamsUpdateProps,
	isTeamsListChildrenProps,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateNotFoundErrorResponse,
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { eraseRoom } from '../../../../server/lib/eraseRoom';
import { canAccessRoomAsync } from '../../../authorization/server';
import { hasPermissionAsync, hasAtLeastOnePermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { removeUserFromRoom } from '../../../lib/server/functions/removeUserFromRoom';
import { settings } from '../../../settings/server';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { eraseTeam } from '../lib/eraseTeam';

const paginatedTeamsResponseSchema = ajv.compile<{ teams: ITeam[]; total: number; count: number; offset: number }>({
	type: 'object',
	properties: {
		teams: { type: 'array', items: { type: 'object' } },
		total: { type: 'number' },
		count: { type: 'number' },
		offset: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['teams', 'total', 'count', 'offset', 'success'],
	additionalProperties: false,
});

const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const teamsEndpoints = API.v1
	.get(
		'teams.list',
		{
			authRequired: true,
			response: {
				200: paginatedTeamsResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, query } = await this.parseJsonQuery();

			const { records, total } = await Team.list(this.userId, { offset, count }, { sort, query });

			return API.v1.success({
				teams: records,
				total,
				count: records.length,
				offset,
			});
		},
	)
	.get(
		'teams.listAll',
		{
			authRequired: true,
			permissionsRequired: ['view-all-teams'],
			response: {
				200: paginatedTeamsResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { offset, count } = await getPaginationItems(this.queryParams);

			const { records, total } = await Team.listAll({ offset, count });

			return API.v1.success({
				teams: records,
				total,
				count: records.length,
				offset,
			});
		},
	)
	.post(
		'teams.create',
		{
			authRequired: true,
			permissionsRequired: ['create-team'],
			body: isTeamsCreateProps,
			response: {
				200: ajv.compile<{ team: ITeam }>({
					type: 'object',
					properties: {
						team: { type: 'object' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['team', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { name, type, members, room, owner } = this.bodyParams;

			const team = await Team.create(this.userId, {
				team: {
					name,
					type,
				},
				room: room as Parameters<typeof Team.create>[1]['room'],
				members,
				owner,
			});

			return API.v1.success({ team });
		},
	);

const getTeamByIdOrName = async (params: { teamId: string } | { teamName: string }): Promise<ITeam | null> => {
	if ('teamId' in params && params.teamId) {
		return Team.getOneById<ITeam>(params.teamId);
	}

	if ('teamName' in params && params.teamName) {
		return Team.getOneByName(params.teamName);
	}

	return null;
};

API.v1.post(
	'teams.convertToChannel',
	{
		authRequired: true,
		body: isTeamsConvertToChannelProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { roomsToRemove = [] } = this.bodyParams;

		const team = await getTeamByIdOrName(this.bodyParams);

		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!(await hasPermissionAsync(this.userId, 'convert-team', team.roomId))) {
			return API.v1.forbidden();
		}

		const rooms = await Team.getMatchingTeamRooms(team._id, roomsToRemove);

		if (rooms.length) {
			for (const room of rooms) {
				await eraseRoom(room, this.user);
			}
		}

		await Promise.all([Team.unsetTeamIdOfRooms(this.user, team), Team.removeAllMembersFromTeam(team._id)]);

		await Team.deleteById(team._id);

		return API.v1.success();
	},
);

const roomResponseSchema = ajv.compile<{ room: object }>({
	type: 'object',
	properties: {
		room: { type: 'object' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['room', 'success'],
	additionalProperties: false,
});

const roomsResponseSchema = ajv.compile<{ rooms: object[] }>({
	type: 'object',
	properties: {
		rooms: { type: 'array', items: { type: 'object' } },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['rooms', 'success'],
	additionalProperties: false,
});

API.v1.post(
	'teams.addRooms',
	{
		authRequired: true,
		body: isTeamsAddRoomsProps,
		response: {
			200: roomsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const team = await getTeamByIdOrName(this.bodyParams);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!(await hasPermissionAsync(this.userId, 'move-room-to-team', team.roomId))) {
			return API.v1.forbidden('error-no-permission-team-channel');
		}

		const { rooms } = this.bodyParams;

		const validRooms = await Team.addRooms(this.userId, rooms, team._id);

		return API.v1.success({ rooms: validRooms });
	},
);

API.v1.post(
	'teams.removeRoom',
	{
		authRequired: true,
		body: isTeamsRemoveRoomProps,
		response: {
			200: roomResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const team = await getTeamByIdOrName(this.bodyParams);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!(await hasPermissionAsync(this.userId, 'remove-team-channel', team.roomId))) {
			return API.v1.forbidden();
		}

		const canRemoveAny = !!(await hasPermissionAsync(this.userId, 'view-all-team-channels', team.roomId));

		const { roomId } = this.bodyParams;

		const room = await Team.removeRoom(this.userId, roomId, team._id, canRemoveAny);

		return API.v1.success({ room });
	},
);

API.v1.post(
	'teams.updateRoom',
	{
		authRequired: true,
		body: isTeamsUpdateRoomProps,
		response: {
			200: roomResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { roomId, isDefault } = this.bodyParams;

		const team = await Team.getOneByRoomId(roomId);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!(await hasPermissionAsync(this.userId, 'edit-team-channel', team.roomId))) {
			return API.v1.forbidden();
		}
		const canUpdateAny = !!(await hasPermissionAsync(this.userId, 'view-all-team-channels', team.roomId));

		if (settings.get('ABAC_Enabled') && isDefault) {
			const room = await Rooms.findOneByIdAndType(roomId, 'p', { projection: { abacAttributes: 1 } });
			if (room?.abacAttributes?.length) {
				return API.v1.failure('error-room-is-abac-managed');
			}
		}

		const room = await Team.updateRoom(this.userId, roomId, isDefault, canUpdateAny);

		return API.v1.success({ room });
	},
);

const paginatedRoomsResponseSchema = ajv.compile<{ rooms: object[]; total: number; count: number; offset: number }>({
	type: 'object',
	properties: {
		rooms: { type: 'array', items: { type: 'object' } },
		total: { type: 'number' },
		count: { type: 'number' },
		offset: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['rooms', 'total', 'count', 'offset', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'teams.listRooms',
	{
		authRequired: true,
		query: isTeamsListRoomsProps,
		response: {
			200: paginatedRoomsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { filter, type } = this.queryParams;
		const { offset, count } = await getPaginationItems(this.queryParams);

		const team = await getTeamByIdOrName(this.queryParams);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		const allowPrivateTeam: boolean = await hasPermissionAsync(this.userId, 'view-all-teams', team.roomId);

		const getAllRooms = await hasPermissionAsync(this.userId, 'view-all-team-channels', team.roomId);

		const listFilter = {
			name: filter ?? undefined,
			isDefault: type === 'autoJoin',
			getAllRooms,
			allowPrivateTeam,
		};

		const { records, total } = await Team.listRooms(this.userId, team._id, listFilter, {
			offset,
			count,
		});

		return API.v1.success({
			rooms: records,
			total,
			count: records.length,
			offset,
		});
	},
);

API.v1.get(
	'teams.listRoomsOfUser',
	{
		authRequired: true,
		query: isTeamsListRoomsOfUserProps,
		response: {
			200: paginatedRoomsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);

		const team = await getTeamByIdOrName(this.queryParams);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		const allowPrivateTeam = await hasPermissionAsync(this.userId, 'view-all-teams', team.roomId);

		const { userId, canUserDelete } = this.queryParams;

		if (!(this.userId === userId || (await hasPermissionAsync(this.userId, 'view-all-team-channels', team.roomId)))) {
			return API.v1.forbidden();
		}

		const booleanCanUserDelete = canUserDelete === 'true';
		const { records, total } = await Team.listRoomsOfUser(this.userId, team._id, userId, allowPrivateTeam, booleanCanUserDelete, {
			offset,
			count,
		});

		return API.v1.success({
			rooms: records,
			total,
			count: records.length,
			offset: 0,
		});
	},
);

const getTeamByIdOrNameOrParentRoom = async (
	params: { teamId: string } | { teamName: string } | { roomId: string },
): Promise<Pick<ITeam, 'type' | 'roomId' | '_id'> | null> => {
	if ('teamId' in params && params.teamId) {
		return Team.getOneById<ITeam>(params.teamId, { projection: { type: 1, roomId: 1 } });
	}
	if ('teamName' in params && params.teamName) {
		return Team.getOneByName(params.teamName, { projection: { type: 1, roomId: 1 } });
	}
	if ('roomId' in params && params.roomId) {
		return Team.getOneByRoomId(params.roomId, { projection: { type: 1, roomId: 1 } });
	}
	return null;
};

// This should accept a teamId, filter (search by name on rooms collection) and sort/pagination
// should return a list of rooms/discussions from the team. the discussions will only be returned from the main room
API.v1.get(
	'teams.listChildren',
	{
		authRequired: true,
		query: isTeamsListChildrenProps,
		response: {
			200: ajv.compile<{ data: object[]; total: number; offset: number; count: number }>({
				type: 'object',
				properties: {
					data: { type: 'array', items: { type: 'object' } },
					total: { type: 'number' },
					offset: { type: 'number' },
					count: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['data', 'total', 'offset', 'count', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			404: validateNotFoundErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort } = await this.parseJsonQuery();
		const { filter, type } = this.queryParams;

		const team = await getTeamByIdOrNameOrParentRoom(this.queryParams);
		if (!team) {
			return API.v1.notFound();
		}

		const result = await Team.listChildren(this.userId, team, filter, type, sort, offset, count);

		return API.v1.success({ data: result.data, total: result.total, offset, count });
	},
);

API.v1.get(
	'teams.members',
	{
		authRequired: true,
		query: isTeamsMembersProps,
		response: {
			200: ajv.compile<{ members: object[]; total: number; count: number; offset: number }>({
				type: 'object',
				properties: {
					members: { type: 'array', items: { type: 'object' } },
					total: { type: 'number' },
					count: { type: 'number' },
					offset: { type: 'number' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['members', 'total', 'count', 'offset', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);

		const { status, username, name } = this.queryParams;

		const team = await getTeamByIdOrName(this.queryParams);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		const canSeeAllMembers = await hasPermissionAsync(this.userId, 'view-all-teams', team.roomId);

		const query: Record<string, unknown> = {};
		if (username) {
			query.username = new RegExp(escapeRegExp(username), 'i');
		}
		if (name) {
			query.name = new RegExp(escapeRegExp(name), 'i');
		}
		if (status) {
			query.status = { $in: status };
		}

		const { records, total } = await Team.members(this.userId, team._id, canSeeAllMembers, { offset, count }, query);

		return API.v1.success({
			members: records,
			total,
			count: records.length,
			offset,
		});
	},
);

API.v1.post(
	'teams.addMembers',
	{
		authRequired: true,
		body: isTeamsAddMembersProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { bodyParams } = this;
		const { members } = bodyParams;

		const team = await getTeamByIdOrName(this.bodyParams);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!(await hasAtLeastOnePermissionAsync(this.userId, ['add-team-member', 'edit-team-member'], team.roomId))) {
			return API.v1.forbidden();
		}

		await Team.addMembers(this.userId, team._id, members);

		return API.v1.success();
	},
);

API.v1.post(
	'teams.updateMember',
	{
		authRequired: true,
		body: isTeamsUpdateMemberProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { bodyParams } = this;
		const { member } = bodyParams;

		const team = await getTeamByIdOrName(this.bodyParams);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!(await hasAtLeastOnePermissionAsync(this.userId, ['edit-team-member'], team.roomId))) {
			return API.v1.forbidden();
		}

		await Team.updateMember(team._id, member);

		return API.v1.success();
	},
);

API.v1.post(
	'teams.removeMember',
	{
		authRequired: true,
		body: isTeamsRemoveMemberProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { bodyParams } = this;
		const { userId, rooms } = bodyParams;

		const team = await getTeamByIdOrName(this.bodyParams);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!(await hasAtLeastOnePermissionAsync(this.userId, ['edit-team-member'], team.roomId))) {
			return API.v1.forbidden();
		}

		const user = await Users.findOneActiveById(userId, {});
		if (!user) {
			return API.v1.failure('invalid-user');
		}

		if (!(await Team.removeMembers(this.userId, team._id, [{ userId }]))) {
			return API.v1.failure('could-not-remove-member');
		}

		if (rooms?.length) {
			const roomsFromTeam: string[] = await Team.getMatchingTeamRooms(team._id, rooms);

			await Promise.all(
				roomsFromTeam.map((rid) =>
					removeUserFromRoom(rid, user, {
						byUser: this.user,
					}),
				),
			);
		}
		return API.v1.success();
	},
);

API.v1.post(
	'teams.leave',
	{
		authRequired: true,
		body: isTeamsLeaveProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { rooms = [] } = this.bodyParams;

		const team = await getTeamByIdOrName(this.bodyParams);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		await Team.removeMembers(this.userId, team._id, [
			{
				userId: this.userId,
			},
		]);

		if (rooms.length) {
			const roomsFromTeam: string[] = await Team.getMatchingTeamRooms(team._id, rooms);
			await Promise.all(roomsFromTeam.map((rid) => removeUserFromRoom(rid, this.user)));
		}

		return API.v1.success();
	},
);

API.v1.get(
	'teams.info',
	{
		authRequired: true,
		query: isTeamsInfoProps,
		response: {
			200: ajv.compile<{ teamInfo: ITeam }>({
				type: 'object',
				properties: {
					teamInfo: { type: 'object' },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['teamInfo', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const teamInfo = await getTeamByIdOrName(this.queryParams);
		if (!teamInfo) {
			return API.v1.failure('Team not found');
		}

		const room = await Rooms.findOneById(teamInfo.roomId);

		if (!room) {
			return API.v1.failure('Room not found');
		}

		const canViewInfo = (await canAccessRoomAsync(room, { _id: this.userId })) || (await hasPermissionAsync(this.userId, 'view-all-teams'));

		if (!canViewInfo) {
			return API.v1.forbidden();
		}

		return API.v1.success({ teamInfo });
	},
);

API.v1.post(
	'teams.delete',
	{
		authRequired: true,
		body: isTeamsDeleteProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { roomsToRemove = [] } = this.bodyParams;

		const team = await getTeamByIdOrName(this.bodyParams);

		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!(await hasPermissionAsync(this.userId, 'delete-team', team.roomId))) {
			return API.v1.forbidden();
		}

		await eraseTeam(this.user, team, roomsToRemove);

		return API.v1.success();
	},
);

API.v1.get(
	'teams.autocomplete',
	{
		authRequired: true,
		query: isTeamsAutocompleteProps,
		response: {
			200: ajv.compile<{ teams: ITeamAutocompleteResult[] }>({
				type: 'object',
				properties: {
					teams: { type: 'array', items: { type: 'object' } },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['teams', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { name } = this.queryParams;

		const teams = await Team.autocomplete(this.userId, name);

		return API.v1.success({ teams });
	},
);

API.v1.post(
	'teams.update',
	{
		authRequired: true,
		body: isTeamsUpdateProps,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { data } = this.bodyParams;

		const team = await getTeamByIdOrName(this.bodyParams);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!(await hasPermissionAsync(this.userId, 'edit-team', team.roomId))) {
			return API.v1.forbidden();
		}

		await Team.update(this.userId, team._id, data);

		return API.v1.success();
	},
);

export type TeamsEndpoints = ExtractRoutesFromAPI<typeof teamsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends TeamsEndpoints {}
}
