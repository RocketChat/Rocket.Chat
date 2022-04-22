import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { GameService } from '../services/game/service';

Meteor.methods({
	async getOneGame(gameId) {
		check(gameId, String);

		const Games = new GameService();

		const game = await Games.getGame(gameId);

		return game;
	},
});
