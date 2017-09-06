Meteor.methods({
	findTokenChannels() {
		if (!Meteor.userId()) {
			return [];
		}

		const user = Meteor.user();

		if (user.services && user.services.tokenly && user.services.tokenly.tcaBalances) {
			const tokens = {};
			user.services.tokenly.tcaBalances.forEach(token => {
				tokens[token.asset] = 1;
			});

			return RocketChat.models.Rooms.findByTokenpass(Object.keys(tokens))
				.filter(room => RocketChat.Tokenpass.validateAccess(room.tokenpass, user.services.tokenly.tcaBalances));
		}

		return [];
	}
});
