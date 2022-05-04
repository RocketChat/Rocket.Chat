import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { GameService } from '../services/game/service';

if (Meteor.isServer) {
	const Games = new GameService();

	Meteor.publish('getPublishedGames', function (paginationOptions, queryOptions) {
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

		return Games.list(paginationOptions, queryOptions);
	});
}
