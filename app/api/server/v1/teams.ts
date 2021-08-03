import { FilterQuery } from 'mongodb';
import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import { Match, check } from 'meteor/check';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { API } from '../api';
import { Team } from '../../../../server/sdk';
import { hasAtLeastOnePermission, hasPermission } from '../../../authorization/server';
import { Users } from '../../../models/server';
import { removeUserFromRoom } from '../../../lib/server/functions/removeUserFromRoom';
import { IUser } from '../../../../definition/IUser';

API.v1.addRoute('teams.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		const { records, total } = Promise.await(Team.list(this.userId, { offset, count }, { sort, query }));

		return API.v1.success({
			teams: records,
			total,
			count: records.length,
			offset,
		});
	},
});

API.v1.addRoute('teams.listAll', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-all-teams')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();

		const { records, total } = Promise.await(Team.listAll({ offset, count }));

		return API.v1.success({
			teams: records,
			total,
			count: records.length,
			offset,
		});
	},
});

API.v1.addRoute('teams.create', { authRequired: true }, {
	post() {
		if (!hasPermission(this.userId, 'create-team')) {
			return API.v1.unauthorized();
		}
		const { name, type, members, room, owner } = this.bodyParams;

		if (!name) {
			return API.v1.failure('Body param "name" is required');
		}

		const team = Promise.await(Team.create(this.userId, {
			team: {
				name,
				type,
			},
			room,
			members,
			owner,
		}));

		return API.v1.success({ team });
	},
});

API.v1.addRoute('teams.convertToChannel', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			teamId: Match.Maybe(String),
			teamName: Match.Maybe(String),
			roomsToRemove: Match.Maybe([String]),
		}));
		const { roomsToRemove, teamId, teamName } = this.bodyParams;

		if (!teamId && !teamName) {
			return API.v1.failure('missing-teamId-or-teamName');
		}

		const team = teamId ? Promise.await(Team.getOneById(teamId)) : Promise.await(Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasPermission(this.userId, 'convert-team', team.roomId)) {
			return API.v1.unauthorized();
		}

		const rooms: string[] = Promise.await(Team.getMatchingTeamRooms(team._id, roomsToRemove));

		if (rooms.length) {
			rooms.forEach((room) => {
				Meteor.call('eraseRoom', room);
			});
		}

		Promise.all([
			Team.unsetTeamIdOfRooms(team._id),
			Team.removeAllMembersFromTeam(team._id),
			Team.deleteById(team._id),
		]);

		return API.v1.success();
	},
});

API.v1.addRoute('teams.addRooms', { authRequired: true }, {
	post() {
		const { rooms, teamId, teamName } = this.bodyParams;

		if (!teamId && !teamName) {
			return API.v1.failure('missing-teamId-or-teamName');
		}

		const team = teamId ? Promise.await(Team.getOneById(teamId)) : Promise.await(Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasPermission(this.userId, 'add-team-channel', team.roomId)) {
			return API.v1.unauthorized('error-no-permission-team-channel');
		}

		const validRooms = Promise.await(Team.addRooms(this.userId, rooms, team._id));

		return API.v1.success({ rooms: validRooms });
	},
});

API.v1.addRoute('teams.removeRoom', { authRequired: true }, {
	post() {
		const { roomId, teamId, teamName } = this.bodyParams;

		const team = teamId ? Promise.await(Team.getOneById(teamId)) : Promise.await(Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasPermission(this.userId, 'remove-team-channel', team.roomId)) {
			return API.v1.unauthorized();
		}

		const canRemoveAny = !!hasPermission(this.userId, 'view-all-team-channels', team.roomId);

		const room = Promise.await(Team.removeRoom(this.userId, roomId, team._id, canRemoveAny));

		return API.v1.success({ room });
	},
});

API.v1.addRoute('teams.updateRoom', { authRequired: true }, {
	post() {
		const { roomId, isDefault } = this.bodyParams;

		const team = Promise.await(Team.getOneByRoomId(roomId));

		if (!hasPermission(this.userId, 'edit-team-channel', team.roomId)) {
			return API.v1.unauthorized();
		}
		const canUpdateAny = !!hasPermission(this.userId, 'view-all-team-channels', team.roomId);

		const room = Promise.await(Team.updateRoom(this.userId, roomId, isDefault, canUpdateAny));

		return API.v1.success({ room });
	},
});

API.v1.addRoute('teams.listRooms', { authRequired: true }, {
	get() {
		const { teamId, teamName, filter, type } = this.queryParams;
		const { offset, count } = this.getPaginationItems();

		const team = teamId ? Promise.await(Team.getOneById(teamId)) : Promise.await(Team.getOneByName(teamName));
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

		const { records, total } = Promise.await(Team.listRooms(this.userId, team._id, listFilter, { offset, count }));

		return API.v1.success({
			rooms: records,
			total,
			count: records.length,
			offset,
		});
	},
});

API.v1.addRoute('teams.listRoomsOfUser', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { teamId, teamName, userId, canUserDelete = false } = this.queryParams;

		const team = teamId ? Promise.await(Team.getOneById(teamId)) : Promise.await(Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		const allowPrivateTeam = hasPermission(this.userId, 'view-all-teams', team.roomId);

		if (!(this.userId === userId || hasPermission(this.userId, 'view-all-team-channels', team.roomId))) {
			return API.v1.unauthorized();
		}

		const { records, total } = Promise.await(Team.listRoomsOfUser(this.userId, team._id, userId, allowPrivateTeam, canUserDelete, { offset, count }));

		return API.v1.success({
			rooms: records,
			total,
			count: records.length,
			offset: 0,
		});
	},
});

API.v1.addRoute('teams.members', { authRequired: true }, {
	get() {
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

		const team = teamId ? Promise.await(Team.getOneById(teamId)) : Promise.await(Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}
		const canSeeAllMembers = hasPermission(this.userId, 'view-all-teams', team.roomId);

		const query = {
			username: username ? new RegExp(escapeRegExp(username), 'i') : undefined,
			name: name ? new RegExp(escapeRegExp(name), 'i') : undefined,
			status: status ? { $in: status } : undefined,
		} as FilterQuery<IUser>;

		const { records, total } = Promise.await(Team.members(this.userId, team._id, canSeeAllMembers, { offset, count }, query));

		return API.v1.success({
			members: records,
			total,
			count: records.length,
			offset,
		});
	},
});

API.v1.addRoute('teams.addMembers', { authRequired: true }, {
	post() {
		const { teamId, teamName, members } = this.bodyParams;

		const team = teamId ? Promise.await(Team.getOneById(teamId)) : Promise.await(Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasAtLeastOnePermission(this.userId, ['add-team-member', 'edit-team-member'], team.roomId)) {
			return API.v1.unauthorized();
		}

		Promise.await(Team.addMembers(this.userId, team._id, members));

		return API.v1.success();
	},
});

API.v1.addRoute('teams.updateMember', { authRequired: true }, {
	post() {
		const { teamId, teamName, member } = this.bodyParams;

		const team = teamId ? Promise.await(Team.getOneById(teamId)) : Promise.await(Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasAtLeastOnePermission(this.userId, ['edit-team-member'], team.roomId)) {
			return API.v1.unauthorized();
		}

		Promise.await(Team.updateMember(team._id, member));

		return API.v1.success();
	},
});

API.v1.addRoute('teams.removeMember', { authRequired: true }, {
	post() {
		const { teamId, teamName, userId, rooms } = this.bodyParams;

		const team = teamId ? Promise.await(Team.getOneById(teamId)) : Promise.await(Team.getOneByName(teamName));
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

		if (!Promise.await(Team.removeMembers(this.userId, team._id, [{ userId }]))) {
			return API.v1.failure();
		}

		if (rooms?.length) {
			const roomsFromTeam: string[] = Promise.await(Team.getMatchingTeamRooms(team._id, rooms));

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
	post() {
		const { teamId, teamName, rooms } = this.bodyParams;

		const team = teamId ? Promise.await(Team.getOneById(teamId)) : Promise.await(Team.getOneByName(teamName));

		Promise.await(Team.removeMembers(this.userId, team._id, [{
			userId: this.userId,
		}]));

		if (rooms?.length) {
			const roomsFromTeam: string[] = Promise.await(Team.getMatchingTeamRooms(team._id, rooms));

			roomsFromTeam.forEach((rid) => {
				removeUserFromRoom(rid, this.user);
			});
		}

		return API.v1.success();
	},
});

API.v1.addRoute('teams.info', { authRequired: true }, {
	get() {
		const { teamId, teamName } = this.queryParams;

		if (!teamId && !teamName) {
			return API.v1.failure('Provide either the "teamId" or "teamName"');
		}

		const teamInfo = teamId
			? Promise.await(Team.getInfoById(teamId))
			: Promise.await(Team.getInfoByName(teamName));

		if (!teamInfo) {
			return API.v1.failure('Team not found');
		}

		return API.v1.success({ teamInfo });
	},
});

API.v1.addRoute('teams.delete', { authRequired: true }, {
	post() {
		const { teamId, teamName, roomsToRemove } = this.bodyParams;

		if (!teamId && !teamName) {
			return API.v1.failure('Provide either the "teamId" or "teamName"');
		}

		if (roomsToRemove && !Array.isArray(roomsToRemove)) {
			return API.v1.failure('The list of rooms to remove is invalid.');
		}

		const team = teamId ? Promise.await(Team.getOneById(teamId)) : Promise.await(Team.getOneByName(teamName));
		if (!team) {
			return API.v1.failure('Team not found.');
		}

		if (!hasPermission(this.userId, 'delete-team', team.roomId)) {
			return API.v1.unauthorized();
		}

		const rooms: string[] = Promise.await(Team.getMatchingTeamRooms(team._id, roomsToRemove));

		// Remove the team's main room
		Meteor.call('eraseRoom', team.roomId);

		// If we got a list of rooms to delete along with the team, remove them first
		if (rooms.length) {
			rooms.forEach((room) => {
				Meteor.call('eraseRoom', room);
			});
		}

		// Move every other room back to the workspace
		Promise.await(Team.unsetTeamIdOfRooms(team._id));

		// Delete all team memberships
		Team.removeAllMembersFromTeam(teamId);

		// And finally delete the team itself
		Promise.await(Team.deleteById(team._id));

		return API.v1.success();
	},
});

API.v1.addRoute('teams.autocomplete', { authRequired: true }, {
	get() {
		const { name } = this.queryParams;

		const teams = Promise.await(Team.autocomplete(this.userId, name));

		return API.v1.success({ teams });
	},
});

API.v1.addRoute('teams.update', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			teamId: String,
			data: {
				name: Match.Maybe(String),
				type: Match.Maybe(Number),
			},
		});

		const { teamId, data } = this.bodyParams;

		const team = teamId && Promise.await(Team.getOneById(teamId));
		if (!team) {
			return API.v1.failure('team-does-not-exist');
		}

		if (!hasPermission(this.userId, 'edit-team', team.roomId)) {
			return API.v1.unauthorized();
		}

		Promise.await(Team.update(this.userId, teamId, { name: data.name, type: data.type }));

		return API.v1.success();
	},
});
