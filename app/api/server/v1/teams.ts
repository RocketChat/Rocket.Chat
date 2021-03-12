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

API.v1.addRoute('teams.info', { authRequired: true }, {
	get() {
		const { teamId, teamName } = this.requestParams();

		if (!teamId && !teamName) {
			return API.v1.failure('Provide either the "teamId" or "teamName"');
		}

		const teamInfo = teamId
			? Promise.await(Team.getInfoById(teamId))
			: Promise.await(Team.getInfoByName(teamName));

		return API.v1.success({ teamInfo });
	},
});
