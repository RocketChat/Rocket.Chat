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

API.v1.addRoute('teams.addRoom', { authRequired: true }, {
	post() {
		const { roomId, teamId, isDefault } = this.bodyParams;

		const room = Promise.await(Team.addRoom(this.userId, roomId, teamId, isDefault));

		return API.v1.success({ room });
	},
});

API.v1.addRoute('teams.removeRoom', { authRequired: true }, {
	post() {
		const { roomId, teamId } = this.bodyParams;

		const room = Promise.await(Team.removeRoom(this.userId, roomId, teamId));

		return API.v1.success({ room });
	},
});

API.v1.addRoute('teams.updateRoom', { authRequired: true }, {
	post() {
		const { roomId, isDefault } = this.bodyParams;

		const room = Promise.await(Team.updateRoom(this.userId, roomId, isDefault));

		return API.v1.success({ room });
	},
});

API.v1.addRoute('teams.listRooms', { authRequired: true }, {
	get() {
		const { teamId } = this.queryParams;

		const rooms = Promise.await(Team.listRooms(this.userId, teamId));

		return API.v1.success({ rooms });
	},
});
