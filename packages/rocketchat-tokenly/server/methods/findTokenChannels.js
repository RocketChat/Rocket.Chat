Meteor.methods({
	findTokenChannels() {
		if (!Meteor.userId()) {
			return [];
		}

		const user = Meteor.user();

		if (user.services && user.services.tokenly && user.services.tokenly.tcaBalances) {
			const tokens = {};
			user.services.tokenly.tcaBalances.forEach(token => {
				// TODO: balanceSat???
				tokens[token.asset] = parseFloat(token.balanceSat);
			});

			return RocketChat.models.Rooms.findByToknepass(Object.keys(tokens)).filter(room => {
				return room.tokenpass.tokens.some(roomToken => {
					return room.tokenpass.minimumBalance <= tokens[roomToken];
				});
			});
		}

		return [];
	}
});
