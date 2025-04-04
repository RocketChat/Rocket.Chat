import { Team } from '@rocket.chat/core-services';
import type { ITeam, UserStatus } from '@rocket.chat/core-typings';
import { TEAM_TYPE, isValidSidepanel } from '@rocket.chat/core-typings';
import { Users, Rooms } from '@rocket.chat/models';
import {
	isTeamsConvertToChannelProps,
	isTeamsRemoveRoomProps,
	isTeamsUpdateMemberProps,
	isTeamsRemoveMemberProps,
	isTeamsAddMembersProps,
	isTeamsDeleteProps,
	isTeamsLeaveProps,
	isTeamsUpdateProps,
	isTeamsListChildrenProps,
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Match, check } from 'meteor/check';

import { eraseRoom } from '../../../../server/lib/eraseRoom';
import { canAccessRoomAsync } from '../../../authorization/server';
import { hasPermissionAsync, hasAtLeastOnePermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { removeUserFromRoom } from '../../../lib/server/functions/removeUserFromRoom';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

API.v1.addRoute(
	'teams.list',
	{ authRequired: true },
	{
		async get() {
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
	},
);

API.v1.addRoute(
	'teams.listAll',
	{ authRequired: true, permissionsRequired: ['view-all-teams'] },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);

			const { records, total } = await Team.listAll({ offset, count });

			return API.v1.success({
				teams: records,
				total,
				count: records.length,
				offset,
			});
		},
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
					type: Match.OneOf(TEAM_TYPE.PRIVATE, TEAM_TYPE.PUBLIC),
					members: Match.Maybe([String]),
					room: Match.Maybe(Match.Any),
					owner: Match.Maybe(String),
				}),
			);

			const { name, type, members, room, owner, sidepanel } = this.bodyParams;

			if (sidepanel?.items && !isValidSidepanel(sidepanel)) {
				throw new Error('error-invalid-sidepanel');
			}

			const team = await Team.create(this.userId, {
				team: {
					name,
					type,
				},
				room,
				members,
				owner,
				sidepanel,
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
				for await (const room of rooms) {
					await eraseRoom(room, this.userId);
				}
			}

			await Promise.all([Team.unsetTeamIdOfRooms(this.userId, team._id), Team.removeAllMembersFromTeam(team._id)]);

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
API.v1.addRoute(
	'teams.listChildren',
	{ authRequired: true, validateParams: isTeamsListChildrenProps },
	{
		async get() {
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
	},
);

API.v1.addRoute(
	'teams.members',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);

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
					status: Match.Maybe([String]),
					username: Match.Maybe(String),
					name: Match.Maybe(String),
				}),
			);

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

API.v1.addRoute(
	'teams.info',
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

			const rooms: string[] = await Team.getMatchingTeamRooms(team._id, roomsToRemove);

			// If we got a list of rooms to delete along with the team, remove them first
			if (rooms.length) {
				for await (const room of rooms) {
					await eraseRoom(room, this.userId);
				}
			}

			// Move every other room back to the workspace
			await Team.unsetTeamIdOfRooms(this.userId, team._id);

			// Remove the team's main room
			await eraseRoom(team.roomId, this.userId);

			// Delete all team memberships
			await Team.removeAllMembersFromTeam(team._id);

			// And finally delete the team itself
			await Team.deleteById(team._id);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'teams.autocomplete',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					name: String,
				}),
			);

			const { name } = this.queryParams;

			const teams = await Team.autocomplete(this.userId, name);

			return API.v1.success({ teams });
		},
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
