import { Meteor } from 'meteor/meteor';

import { Rooms } from '../../../models';
import { Tokenpass } from '../Tokenpass';

Meteor.methods({
	findTokenChannels() {
		if (!Meteor.userId()) {
			return [];
		}

		const user = Meteor.user();

		if (user.services && user.services.tokenpass && user.services.tokenpass.tcaBalances) {
			const tokens = {};
			user.services.tokenpass.tcaBalances.forEach((token) => {
				tokens[token.asset] = 1;
			});

			return Rooms.findByTokenpass(Object.keys(tokens)).filter((room) =>
				Tokenpass.validateAccess(room.tokenpass, user.services.tokenpass.tcaBalances),
			);
		}

		return [];
	},
});
