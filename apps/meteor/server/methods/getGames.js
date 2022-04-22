import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { GameService } from '../services/game/service';

Meteor.methods({
	async getGames(paginationOptions, queryOptions) {
		check(
			paginationOptions,
			Match.ObjectIncluding({
				offset: Match.Optional(Number),
				count: Match.Optional(Number),
			}),
		);
		check(
			queryOptions,
			Match.ObjectIncluding({
				sort: Match.Optional(Object),
				query: Match.Optional(Object),
			}),
		);

		const Games = new GameService();

		const results = await Games.list(paginationOptions, queryOptions);

		return results;
	},
});
