import { Promise } from 'meteor/promise';
// import { Meteor } from 'meteor/meteor';
// import { Match, check } from 'meteor/check';

import { API } from '../api';
import { Team } from '../../../../server/sdk';
// import { BannerPlatform } from '../../../../definition/IBanner';

API.v1.addRoute('teams.list', { authRequired: true }, {
	get() {
		const teams = Promise.await(Team.list(this.userId));

		return API.v1.success({ teams });
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
