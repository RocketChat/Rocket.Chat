import { Promise } from 'meteor/promise';

import { API } from '../api';
import { Team } from '../../../../server/sdk';
import { hasPermission } from '../../../authorization/server';

API.v1.addRoute('teams.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();

		const { records, total } = Promise.await(Team.list(this.userId, { offset, count }));

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

API.v1.addRoute('teams.addRoom', { authRequired: true }, {
	post() {
		const { roomId, teamId, isDefault } = this.bodyParams;

		if (!hasPermission(this.userId, 'add-team-channel')) {
			return API.v1.unauthorized();
		}

		const room = Promise.await(Team.addRoom(this.userId, roomId, teamId, isDefault));

		return API.v1.success({ room });
	},
});

API.v1.addRoute('teams.removeRoom', { authRequired: true }, {
	post() {
		const { roomId, teamId } = this.bodyParams;

		if (!hasPermission(this.userId, 'remove-team-channel')) {
			return API.v1.unauthorized();
		}

		const room = Promise.await(Team.removeRoom(this.userId, roomId, teamId));

		return API.v1.success({ room });
	},
});

API.v1.addRoute('teams.updateRoom', { authRequired: true }, {
	post() {
		const { roomId, isDefault } = this.bodyParams;

		if (!hasPermission(this.userId, 'edit-team-channel')) {
			return API.v1.unauthorized();
		}

		const room = Promise.await(Team.updateRoom(this.userId, roomId, isDefault));

		return API.v1.success({ room });
	},
});

API.v1.addRoute('teams.listRooms', { authRequired: true }, {
	get() {
		const { teamId } = this.queryParams;
		const { offset, count } = this.getPaginationItems();

		const allowPrivateTeam = hasPermission(this.userId, 'view-all-teams');

		let getAllRooms = false;
		if (hasPermission(this.userId, 'view-all-team-channels')) {
			getAllRooms = true;
		}


		const { records, total } = Promise.await(Team.listRooms(this.userId, teamId, getAllRooms, allowPrivateTeam, { offset, count }));

		return API.v1.success({
			rooms: records,
			total,
			count: records.length,
			offset,
		});
	},
});

API.v1.addRoute('teams.members', { authRequired: true }, {
	get() {
		const { teamId } = this.queryParams;

		if (!teamId) {
			return API.v1.failure('Team ID is required');
		}

		const members = Promise.await(Team.members(this.userId, teamId));

		return API.v1.success({ members });
	},
});
