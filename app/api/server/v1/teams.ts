import { Promise } from 'meteor/promise';
// import { Meteor } from 'meteor/meteor';
// import { Match, check } from 'meteor/check';

import { API } from '../api';
import { Team } from '../../../../server/sdk';
// import { BannerPlatform } from '../../../../definition/IBanner';

API.v1.addRoute('teams.list', { authRequired: true }, {
	get() {
		// check(this.queryParams, Match.ObjectIncluding({
		// 	platform: String,
		// 	bid: Match.Maybe(String),
		// }));

		const teams = Promise.await(Team.list(this.userId));

		return API.v1.success({ teams });
	},
});

API.v1.addRoute('teams.create', { authRequired: true }, {
	post() {
		const { name, type, members, room } = this.bodyParams;

		const team = Promise.await(Team.create(this.userId, {
			team: {
				name,
				type,
			},
			room,
			members,
		}));

		return API.v1.success({ team });
	},
});
