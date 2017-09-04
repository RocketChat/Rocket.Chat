Meteor.methods({
	findTokenChannels() {
		if (!Meteor.userId()) {
			return [];
		}

		const user = Meteor.user();

		if (user.services && user.services.tokenly && user.services.tokenly.tcaBalances) {
			const tokens = {};
			user.services.tokenly.tcaBalances.forEach(token => {
				tokens[token.asset] = parseFloat(token.balance);
			});

			return RocketChat.models.Rooms.findByToknepass(Object.keys(tokens)).filter(room => {
				const compFunc = room.tokenpass.require === 'any' ? 'some' : 'every';
				return room.tokenpass.tokens[compFunc](config => typeof tokens[config.token] !== 'undefined' && parseFloat(config.balance) <= tokens[config.token]);
			});
		}

		return [];
	}
});
