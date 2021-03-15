import { Promise } from 'meteor/promise';
import { Match, check } from 'meteor/check';

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

API.v1.addRoute('teams.update', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			teamId: String,
			data: Match.ObjectIncluding({
				name: Match.Maybe(String),
				type: Match.Maybe(Number),
				room: Match.Maybe(Object),
				members: Match.Maybe(Array),
			}),
		});

		const { teamId, data } = this.bodyParams;

		const teamData = {
			_id: teamId,
			...data,
		};

		Team.update(teamData);
	},
});
