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
