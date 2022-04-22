import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { GameService } from '../services/game/service';

Meteor.methods({
	async updateGame(gameId, params) {
		check(gameId, String);
		check(
			params,
			Match.ObjectIncluding({
				title: Match.Optional(String),
				description: Match.Optional(String),
				tags: Match.Optional([String]),
				ranking: Match.Optional(Number),
			}),
		);

		const Games = new GameService();

		const game = await Games.update(gameId, params);

		return game;
	},
});
