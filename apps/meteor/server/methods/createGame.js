import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { GameService } from '../services/game/service';

Meteor.methods({
	async createGame(params) {
		check(
			params,
			Match.ObjectIncluding({
				title: String,
				description: String,
				ranking: Match.Optional(Number),
				tags: Match.Optional([String]),
			}),
		);

		const Games = new GameService();

		const game = await Games.create(params);

		return game;
	},
});
