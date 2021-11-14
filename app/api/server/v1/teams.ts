import { FilterQuery } from 'mongodb';
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { API } from '../api';
import { Team } from '../../../../server/sdk';
import { hasAtLeastOnePermission, hasPermission } from '../../../authorization/server';
import { Users } from '../../../models/server';
import { removeUserFromRoom } from '../../../lib/server/functions/removeUserFromRoom';
import { IUser } from '../../../../definition/IUser';
import { isTeamPropsWithTeamName, isTeamPropsWithTeamId } from '../../../../definition/rest/v1/teams';
import { isTeamsConvertToChannelProps } from '../../../../definition/rest/v1/teams/TeamsConvertToChannelProps';
import { isTeamsRemoveRoomProps } from '../../../../definition/rest/v1/teams/TeamsRemoveRoomProps';
import { isTeamsUpdateMemberProps } from '../../../../definition/rest/v1/teams/TeamsUpdateMemberProps';
import { isTeamsRemoveMemberProps } from '../../../../definition/rest/v1/teams/TeamsRemoveMemberProps';
import { isTeamsAddMembersProps } from '../../../../definition/rest/v1/teams/TeamsAddMembersProps';
import { isTeamsDeleteProps } from '../../../../definition/rest/v1/teams/TeamsDeleteProps';
import { isTeamsLeaveProps } from '../../../../definition/rest/v1/teams/TeamsLeaveProps';

API.v1.addRoute('teams.list', { authRequired: true }, {
	async get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		const { records, total } = await Team.list(this.userId, { offset, count }, { sort, query });

		return API.v1.success({
			teams: records,
			total,
			count: records.length,
			offset,
		});
	},
});

API.v1.addRoute('teams.listAll', { authRequired: true }, {
	async get() {
		if (!hasPermission(this.userId, 'view-all-teams')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems() as { offset: number; count: number };

		const { records, total } = await Team.listAll({ offset, count });

		return API.v1.success({
			teams: records,
			total,
			count: records.length,
			offset,
		});
	},
});

API.v1.addRoute('teams.create', { authRequired: true }, {
	async post() {
		if (!hasPermission(this.userId, 'create-team')) {
			return API.v1.unauthorized();
		}
		const { name, type, members, room, owner } = this.bodyParams;

		if (!name) {
			return API.v1.failure('Body param "name" is required');
		}

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
});

API.v1.addRoute('teams.convertToChannel', { authRequired: true }, {
	async post() {
		if (!isTeamsConvertToChannelProps(this.bodyParams)) {
			return API.v1.failure('invalid-body-params', isTeamsConvertToChannelProps.errors?.map((e) => e.message).join('\n '));
		}

		const { bodyParams } = this;

		const { roomsToRemove = [] } = bodyParams;

		const team = await (
			(isTeamPropsWithTeamId(bodyParams) && Team.getOneById(bodyParams.teamId))
			|| (isTeamPropsWithTeamName(bodyParams) && Team.getOneByName(bodyParams.teamName))
		);

		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasPermission(this.userId, 'convert-team', team.roomId)) {
			return API.v1.unauthorized();
		}

		const rooms = await Team.getMatchingTeamRooms(team._id, roomsToRemove);

		if (rooms.length) {
			rooms.forEach((room) => {
				Meteor.call('eraseRoom', room);
			});
		}

		await Promise.all([
			Team.unsetTeamIdOfRooms(team._id),
			Team.removeAllMembersFromTeam(team._id),
			Team.deleteById(team._id),
		]);

		return API.v1.success();
	},
});

API.v1.addRoute('teams.addRooms', { authRequired: true }, {
	async post() {
		const { rooms, teamId, teamName } = this.bodyParams;

		if (!teamId && !teamName) {
			return API.v1.failure('missing-teamId-or-teamName');
		}

		const team = await (teamId ? Team.getOneById(teamId) : Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasPermission(this.userId, 'add-team-channel', team.roomId)) {
			return API.v1.unauthorized('error-no-permission-team-channel');
		}

		const validRooms = await Team.addRooms(this.userId, rooms, team._id);

		return API.v1.success({ rooms: validRooms });
	},
});

API.v1.addRoute('teams.removeRoom', { authRequired: true }, {
	async post() {
		if (!isTeamsRemoveRoomProps(this.bodyParams)) {
			return API.v1.failure('body-params-invalid', isTeamsRemoveRoomProps.errors?.map((error) => error.message).join('\n '));
		}
		const { roomId, teamId, teamName } = this.bodyParams;

		const team = await (teamId ? Team.getOneById(teamId) : Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasPermission(this.userId, 'remove-team-channel', team.roomId)) {
			return API.v1.unauthorized();
		}

		const canRemoveAny = !!hasPermission(this.userId, 'view-all-team-channels', team.roomId);

		const room = await Team.removeRoom(this.userId, roomId, team._id, canRemoveAny);

		return API.v1.success({ room });
	},
});

API.v1.addRoute('teams.updateRoom', { authRequired: true }, {
	async post() {
		const { roomId, isDefault } = this.bodyParams;

		const team = await Team.getOneByRoomId(roomId);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasPermission(this.userId, 'edit-team-channel', team.roomId)) {
			return API.v1.unauthorized();
		}
		const canUpdateAny = !!hasPermission(this.userId, 'view-all-team-channels', team.roomId);

		const room = await Team.updateRoom(this.userId, roomId, isDefault, canUpdateAny);

		return API.v1.success({ room });
	},
});

API.v1.addRoute('teams.listRooms', { authRequired: true }, {
	async get() {
		const { teamId, teamName, filter, type } = this.queryParams;
		const { offset, count } = this.getPaginationItems();

		const team = await (teamId ? Team.getOneById(teamId) : Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		const allowPrivateTeam = hasPermission(this.userId, 'view-all-teams', team.roomId);

		let getAllRooms = false;
		if (hasPermission(this.userId, 'view-all-team-channels', team.roomId)) {
			getAllRooms = true;
		}

		const listFilter = {
			name: filter,
			isDefault: type === 'autoJoin',
			getAllRooms,
			allowPrivateTeam,
		};

		const { records, total } = await Team.listRooms(this.userId, team._id, listFilter, { offset, count });

		return API.v1.success({
			rooms: records,
			total,
			count: records.length,
			offset,
		});
	},
});

API.v1.addRoute('teams.listRoomsOfUser', { authRequired: true }, {
	async get() {
		const { offset, count } = this.getPaginationItems();
		const { teamId, teamName, userId, canUserDelete = false } = this.queryParams;


		if (!teamId && !teamName) {
			return API.v1.failure('missing-teamId-or-teamName');
		}

		const team = await (teamId ? Team.getOneById(teamId) : Team.getOneByName(teamName!));

		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		const allowPrivateTeam = hasPermission(this.userId, 'view-all-teams', team.roomId);

		if (!(this.userId === userId || hasPermission(this.userId, 'view-all-team-channels', team.roomId))) {
			return API.v1.unauthorized();
		}

		const { records, total } = await Team.listRoomsOfUser(this.userId, team._id, userId, allowPrivateTeam, canUserDelete, { offset, count });

		return API.v1.success({
			rooms: records,
			total,
			count: records.length,
			offset: 0,
		});
	},
});

API.v1.addRoute('teams.members', { authRequired: true }, {
	async get() {
		const { offset, count } = this.getPaginationItems();

		check(this.queryParams, Match.ObjectIncluding({
			teamId: Match.Maybe(String),
			teamName: Match.Maybe(String),
			status: Match.Maybe([String]),
			username: Match.Maybe(String),
			name: Match.Maybe(String),
		}));
		const { teamId, teamName, status, username, name } = this.queryParams;

		if (!teamId && !teamName) {
			return API.v1.failure('missing-teamId-or-teamName');
		}

		const team = await (teamId ? Team.getOneById(teamId) : Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}
		const canSeeAllMembers = hasPermission(this.userId, 'view-all-teams', team.roomId);

		const query = {
			username: username ? new RegExp(escapeRegExp(username), 'i') : undefined,
			name: name ? new RegExp(escapeRegExp(name), 'i') : undefined,
			status: status ? { $in: status } : undefined,
		} as FilterQuery<IUser>;

		const { records, total } = await Team.members(this.userId, team._id, canSeeAllMembers, { offset, count }, query);

		return API.v1.success({
			members: records,
			total,
			count: records.length,
			offset,
		});
	},
});

API.v1.addRoute('teams.addMembers', { authRequired: true }, {
	async post() {
		if (!isTeamsAddMembersProps(this.bodyParams)) {
			return API.v1.failure('invalid-params');
		}

		const { bodyParams } = this;
		const { members } = bodyParams;

		const team = await (
			(isTeamPropsWithTeamId(bodyParams) && Team.getOneById(bodyParams.teamId))
			|| (isTeamPropsWithTeamName(bodyParams) && Team.getOneByName(bodyParams.teamName))
		);

		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasAtLeastOnePermission(this.userId, ['add-team-member', 'edit-team-member'], team.roomId)) {
			return API.v1.unauthorized();
		}

		await Team.addMembers(this.userId, team._id, members);

		return API.v1.success();
	},
});

API.v1.addRoute('teams.updateMember', { authRequired: true }, {
	async post() {
		if (!isTeamsUpdateMemberProps(this.bodyParams)) {
			return API.v1.failure('invalid-params', isTeamsUpdateMemberProps.errors?.map((e) => e.message).join('\n '));
		}

		const { bodyParams } = this;
		const { member } = bodyParams;

		const team = await (
			(isTeamPropsWithTeamId(bodyParams) && Team.getOneById(bodyParams.teamId))
			|| (isTeamPropsWithTeamName(bodyParams) && Team.getOneByName(bodyParams.teamName))
		);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasAtLeastOnePermission(this.userId, ['edit-team-member'], team.roomId)) {
			return API.v1.unauthorized();
		}

		await Team.updateMember(team._id, member);

		return API.v1.success();
	},
});

API.v1.addRoute('teams.removeMember', { authRequired: true }, {
	async post() {
		if (!isTeamsRemoveMemberProps(this.bodyParams)) {
			return API.v1.failure('invalid-params', isTeamsRemoveMemberProps.errors?.map((e) => e.message).join('\n '));
		}

		const { bodyParams } = this;
		const { userId, rooms } = bodyParams;

		const team = await (
			(isTeamPropsWithTeamId(bodyParams) && Team.getOneById(bodyParams.teamId))
			|| (isTeamPropsWithTeamName(bodyParams) && Team.getOneByName(bodyParams.teamName))
		);

		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasAtLeastOnePermission(this.userId, ['edit-team-member'], team.roomId)) {
			return API.v1.unauthorized();
		}

		const user = Users.findOneActiveById(userId, {});
		if (!user) {
			return API.v1.failure('invalid-user');
		}

		if (!await Team.removeMembers(this.userId, team._id, [{ userId }])) {
			return API.v1.failure();
		}

		if (rooms?.length) {
			const roomsFromTeam: string[] = await Team.getMatchingTeamRooms(team._id, rooms);

			roomsFromTeam.forEach((rid) => {
				removeUserFromRoom(rid, user, {
					byUser: this.user,
				});
			});
		}
		return API.v1.success();
	},
});

API.v1.addRoute('teams.leave', { authRequired: true }, {
	async post() {
		if (!isTeamsLeaveProps(this.bodyParams)) {
			return API.v1.failure('invalid-params', isTeamsLeaveProps.errors?.map((e) => e.message).join('\n '));
		}

		const { bodyParams } = this;

		const { rooms = [] } = bodyParams;

		const team = await (
			(isTeamPropsWithTeamId(bodyParams) && Team.getOneById(bodyParams.teamId))
			|| (isTeamPropsWithTeamName(bodyParams) && Team.getOneByName(bodyParams.teamName))
		);

		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		await Team.removeMembers(this.userId, team._id, [{
			userId: this.userId,
		}]);

		if (rooms.length) {
			const roomsFromTeam: string[] = await Team.getMatchingTeamRooms(team._id, rooms);

			roomsFromTeam.forEach((rid) => {
				removeUserFromRoom(rid, this.user);
			});
		}

		return API.v1.success();
	},
});

API.v1.addRoute('teams.info', { authRequired: true }, {
	async get() {
		const { teamId, teamName } = this.queryParams;

		if (!teamId && !teamName) {
			return API.v1.failure('Provide either the "teamId" or "teamName"');
		}

		const teamInfo = await (teamId
			? Team.getInfoById(teamId)
			: Team.getInfoByName(teamName));

		if (!teamInfo) {
			return API.v1.failure('Team not found');
		}

		return API.v1.success({ teamInfo });
	},
});

API.v1.addRoute('teams.delete', { authRequired: true }, {
	async post() {
		const { bodyParams } = this;
		const { roomsToRemove = [] } = this.bodyParams;

		if (!isTeamsDeleteProps(bodyParams)) {
			return API.v1.failure('invalid-params', isTeamsDeleteProps.errors?.map((e) => e.message).join('\n '));
		}

		const team = await (
			(isTeamPropsWithTeamId(bodyParams) && Team.getOneById(bodyParams.teamId))
			|| (isTeamPropsWithTeamName(bodyParams) && Team.getOneByName(bodyParams.teamName))
		);

		if (!team) {
			return API.v1.failure('Team not found.');
		}

		if (!hasPermission(this.userId, 'delete-team', team.roomId)) {
			return API.v1.unauthorized();
		}

		const rooms: string[] = await Team.getMatchingTeamRooms(team._id, roomsToRemove);

		// Remove the team's main room
		Meteor.call('eraseRoom', team.roomId);

		// If we got a list of rooms to delete along with the team, remove them first
		if (rooms.length) {
			rooms.forEach((room) => {
				Meteor.call('eraseRoom', room);
			});
		}

		// Move every other room back to the workspace
		await Team.unsetTeamIdOfRooms(team._id);

		// Delete all team memberships
		Team.removeAllMembersFromTeam(team._id);

		// And finally delete the team itself
		await Team.deleteById(team._id);

		return API.v1.success();
	},
});

API.v1.addRoute('teams.autocomplete', { authRequired: true }, {
	async get() {
		const { name } = this.queryParams;

		const teams = await Team.autocomplete(this.userId, name);

		return API.v1.success({ teams });
	},
});

API.v1.addRoute('teams.update', { authRequired: true }, {
	async post() {
		check(this.bodyParams, {
			teamId: String,
			data: {
				name: String,
				type: Number,
			},
		});

		const { teamId, data } = this.bodyParams;

		const team = teamId && await Team.getOneById(teamId);
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasPermission(this.userId, 'edit-team', team.roomId)) {
			return API.v1.unauthorized();
		}

		await Team.update(this.userId, teamId, { name: data.name, type: data.type });

		return API.v1.success();
	},
});
