import { Team } from '@rocket.chat/core-services';
import type { ITeam, UserStatus } from '@rocket.chat/core-typings';
import { TeamType } from '@rocket.chat/core-typings';
import { Users, Rooms } from '@rocket.chat/models';
import {
	ajv,
	ajvQuery,
	isTeamsConvertToChannelProps,
	isTeamsRemoveRoomProps,
	isTeamsUpdateMemberProps,
	isTeamsRemoveMemberProps,
	isTeamsAddMembersProps,
	isTeamsDeleteProps,
	isTeamsLeaveProps,
	isTeamsUpdateProps,
	isTeamsListChildrenProps,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateNotFoundErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Match, check } from 'meteor/check';

import { eraseRoom } from '../../../../server/lib/eraseRoom';
import { canAccessRoomAsync } from '../../../authorization/server';
import { hasPermissionAsync, hasAtLeastOnePermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { removeUserFromRoom } from '../../../lib/server/functions/removeUserFromRoom';
import { settings } from '../../../settings/server';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { eraseTeam } from '../lib/eraseTeam';

type TeamsListQuery = {
	count?: number;
	offset?: number;
	sort?: string;
	query?: string;
};

type TeamsListAllQuery = {
	count?: number;
	offset?: number;
};

type TeamsInfoQuery = {
	teamId?: string;
	teamName?: string;
};

type TeamsMembersQuery = {
	teamId?: string;
	teamName?: string;
	status?: string[];
	username?: string;
	name?: string;
	count?: number;
	offset?: number;
};

type TeamsAutocompleteQuery = {
	name: string;
};

const TeamsListQuerySchema = {
	type: 'object',
	properties: {
		count: { type: 'number', nullable: true },
		offset: { type: 'number', nullable: true },
		sort: { type: 'string', nullable: true },
		query: { type: 'string', nullable: true },
	},
	required: [],
	additionalProperties: true,
} as const;

const TeamsListAllQuerySchema = {
	type: 'object',
	properties: {
		count: { type: 'number', nullable: true },
		offset: { type: 'number', nullable: true },
	},
	required: [],
	additionalProperties: true,
} as const;

const TeamsInfoQuerySchema = {
	type: 'object',
	properties: {
		teamId: { type: 'string', nullable: true },
		teamName: { type: 'string', nullable: true },
	},
	oneOf: [{ required: ['teamId'] }, { required: ['teamName'] }],
	additionalProperties: true,
} as const;

const TeamsMembersQuerySchema = {
	type: 'object',
	properties: {
		teamId: { type: 'string', nullable: true },
		teamName: { type: 'string', nullable: true },
		status: { type: 'array', items: { type: 'string' }, nullable: true },
		username: { type: 'string', nullable: true },
		name: { type: 'string', nullable: true },
		count: { type: 'number', nullable: true },
		offset: { type: 'number', nullable: true },
	},
	oneOf: [{ required: ['teamId'] }, { required: ['teamName'] }],
	additionalProperties: true,
} as const;

const TeamsAutocompleteQuerySchema = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1 },
	},
	required: ['name'],
	additionalProperties: false,
} as const;

const isTeamsListProps = ajvQuery.compile<TeamsListQuery>(TeamsListQuerySchema);
const isTeamsListAllProps = ajvQuery.compile<TeamsListAllQuery>(TeamsListAllQuerySchema);
const isTeamsInfoProps = ajvQuery.compile<TeamsInfoQuery>(TeamsInfoQuerySchema);
const isTeamsMembersProps = ajvQuery.compile<TeamsMembersQuery>(TeamsMembersQuerySchema);
const isTeamsAutocompleteProps = ajvQuery.compile<TeamsAutocompleteQuery>(TeamsAutocompleteQuerySchema);

const teamsPaginatedResponseSchema = ajv.compile<{
	teams: ITeam[];
	total: number;
	count: number;
	offset: number;
	success: true;
}>({
	type: 'object',
	properties: {
		teams: { type: 'array', items: { $ref: '#/components/schemas/ITeam' } },
		total: { type: 'number' },
		count: { type: 'number' },
		offset: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['teams', 'total', 'count', 'offset', 'success'],
	additionalProperties: false,
});

const teamsListChildrenResponseSchema = ajv.compile<{
	data: Record<string, unknown>[];
	total: number;
	count: number;
	offset: number;
	success: true;
}>({
	type: 'object',
	properties: {
		data: { type: 'array', items: { $ref: '#/components/schemas/IRoom' } },
		total: { type: 'number' },
		count: { type: 'number' },
		offset: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['data', 'total', 'count', 'offset', 'success'],
	additionalProperties: false,
});

const teamsMembersResponseSchema = ajv.compile<{
	members: {
		user: {
			_id: string;
			username?: string;
			name?: string;
			status?: string;
			settings?: Record<string, unknown>;
		};
		roles?: string[] | null;
		createdBy: {
			_id: string;
			username?: string;
		};
		createdAt: string;
	}[];
	total: number;
	count: number;
	offset: number;
	success: true;
}>({
	type: 'object',
	properties: {
		members: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					user: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							username: { type: 'string' },
							name: { type: 'string' },
							status: { type: 'string' },
							settings: { type: 'object', additionalProperties: true },
						},
						required: ['_id'],
						additionalProperties: true,
					},
					roles: {
						oneOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
					},
					createdBy: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							username: { type: 'string' },
						},
						required: ['_id'],
						additionalProperties: true,
					},
					createdAt: { type: 'string', format: 'date-time' },
				},
				required: ['user', 'createdBy', 'createdAt'],
				additionalProperties: true,
			},
		},
		total: { type: 'number' },
		count: { type: 'number' },
		offset: { type: 'number' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['members', 'total', 'count', 'offset', 'success'],
	additionalProperties: false,
});

const teamsInfoResponseSchema = ajv.compile<{ teamInfo: ITeam; success: true }>({
	type: 'object',
	properties: {
		teamInfo: { $ref: '#/components/schemas/ITeam' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['teamInfo', 'success'],
	additionalProperties: false,
});

const teamsAutocompleteResponseSchema = ajv.compile<{
	teams: {
		_id: string;
		fname?: string;
		teamId?: string;
		name?: string;
		t?: string;
		avatarETag?: string;
	}[];
	success: true;
}>({
	type: 'object',
	properties: {
		teams: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					_id: { type: 'string' },
					fname: { type: 'string' },
					teamId: { type: 'string' },
					name: { type: 'string' },
					t: { type: 'string' },
					avatarETag: { type: 'string' },
				},
				required: ['_id'],
				additionalProperties: true,
			},
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['teams', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'teams.list',
	{
		authRequired: true,
		query: isTeamsListProps,
		response: {
			200: teamsPaginatedResponseSchema,
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
);

API.v1.get(
	'teams.listAll',
	{
		authRequired: true,
		permissionsRequired: ['view-all-teams'],
		query: isTeamsListAllProps,
		response: {
			200: teamsPaginatedResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
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
);

API.v1.addRoute(
	'teams.create',
	{ authRequired: true, permissionsRequired: ['create-team'] },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					name: String,
					type: Match.OneOf(TeamType.PRIVATE, TeamType.PUBLIC),
					members: Match.Maybe([String]),
					room: Match.Maybe(Match.Any),
					owner: Match.Maybe(String),
				}),
			);

			const { name, type, members, room, owner } = this.bodyParams;

			const team = await Team.create(this.userId, {
				team: {
					name,
					type,
				},
				room,
				members,
				owner,
			});

			return API.v1.success({ team });
		},
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

API.v1.addRoute(
	'teams.convertToChannel',
	{
		authRequired: true,
		validateParams: isTeamsConvertToChannelProps,
	},
	{
		async post() {
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
	},
);

API.v1.addRoute(
	'teams.addRooms',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.OneOf(
					Match.ObjectIncluding({
						teamId: String,
						rooms: [String] as [StringConstructor],
					}),
					Match.ObjectIncluding({
						teamName: String,
						rooms: [String] as [StringConstructor],
					}),
				),
			);

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
	},
);

API.v1.addRoute(
	'teams.removeRoom',
	{
		authRequired: true,
		validateParams: isTeamsRemoveRoomProps,
	},
	{
		async post() {
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
	},
);

API.v1.addRoute(
	'teams.updateRoom',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					roomId: String,
					isDefault: Boolean,
				}),
			);

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
	},
);

API.v1.addRoute(
	'teams.listRooms',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.OneOf(
					Match.ObjectIncluding({
						teamId: String,
					}),
					Match.ObjectIncluding({
						teamName: String,
					}),
				),
			);

			check(
				this.queryParams,
				Match.ObjectIncluding({
					filter: Match.Maybe(String),
					type: Match.Maybe(String),
					offset: Match.Maybe(String),
					count: Match.Maybe(String),
				}),
			);

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
	},
);

API.v1.addRoute(
	'teams.listRoomsOfUser',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.OneOf(
					Match.ObjectIncluding({
						teamId: String,
					}),
					Match.ObjectIncluding({
						teamName: String,
					}),
				),
			);

			check(
				this.queryParams,
				Match.ObjectIncluding({
					userId: String,
					canUserDelete: Match.Maybe(String),
					offset: Match.Maybe(String),
					count: Match.Maybe(String),
				}),
			);

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
			200: teamsListChildrenResponseSchema,
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

		const data = await Team.listChildren(this.userId, team, filter, type, sort, offset, count);

		return API.v1.success({ ...data, offset, count });
	},
);

API.v1.get(
	'teams.members',
	{
		authRequired: true,
		query: isTeamsMembersProps,
		response: {
			200: teamsMembersResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
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

		const query = {
			...(username && { username: new RegExp(escapeRegExp(username), 'i') }),
			...(name && { name: new RegExp(escapeRegExp(name), 'i') }),
			...(status && { status: { $in: status as UserStatus[] } }),
		};

		const { records, total } = await Team.members(this.userId, team._id, canSeeAllMembers, { offset, count }, query);

		return API.v1.success({
			members: records,
			total,
			count: records.length,
			offset,
		});
	},
);

API.v1.addRoute(
	'teams.addMembers',
	{
		authRequired: true,
		validateParams: isTeamsAddMembersProps,
	},
	{
		async post() {
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
	},
);

API.v1.addRoute(
	'teams.updateMember',
	{
		authRequired: true,
		validateParams: isTeamsUpdateMemberProps,
	},
	{
		async post() {
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
	},
);

API.v1.addRoute(
	'teams.removeMember',
	{
		authRequired: true,
		validateParams: isTeamsRemoveMemberProps,
	},
	{
		async post() {
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
				return API.v1.failure();
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
	},
);

API.v1.addRoute(
	'teams.leave',
	{
		authRequired: true,
		validateParams: isTeamsLeaveProps,
	},
	{
		async post() {
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
	},
);

API.v1.get(
	'teams.info',
	{
		authRequired: true,
		query: isTeamsInfoProps,
		response: {
			200: teamsInfoResponseSchema,
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

		const canViewInfo =
			(await canAccessRoomAsync(room, { _id: this.userId })) || (await hasPermissionAsync(this.userId, 'view-all-teams'));

		if (!canViewInfo) {
			return API.v1.forbidden();
		}

		return API.v1.success({ teamInfo });
	},
);

API.v1.addRoute(
	'teams.delete',
	{
		authRequired: true,
		validateParams: isTeamsDeleteProps,
	},
	{
		async post() {
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
	},
);

API.v1.get(
	'teams.autocomplete',
	{
		authRequired: true,
		query: isTeamsAutocompleteProps,
		response: {
			200: teamsAutocompleteResponseSchema,
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

API.v1.addRoute(
	'teams.update',
	{
		authRequired: true,
		validateParams: isTeamsUpdateProps,
	},
	{
		async post() {
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
	},
);
