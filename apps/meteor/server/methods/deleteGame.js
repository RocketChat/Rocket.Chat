import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { GameService } from '../services/game/service';

Meteor.methods({
	async deleteGame(gameId) {
		check(gameId, String);

		const Games = new GameService();

		await Games.delete(gameId);

		return true;
	},
});
