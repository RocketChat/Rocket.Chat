Template.tokenlyRoomList.onRendered(function() {
	const user = Meteor.user();

	if (user && user.services && user.services.tokenly) {
		try {
			Meteor.call('updateUserTokenlyBalances');

			const userTokens = [];
			_.each(user.services.tokenly.tcaBalances, (token) => {
				userTokens.push(token.asset);
			});

			this.tokenlyRooms.set(RocketChat.models.Rooms.findByTokens(userTokens));
		} catch (error) {
			throw new Meteor.Error('error-not-allowed', 'Token required');
		}
	} else {
		throw new Meteor.Error('error-not-allowed', 'Token required');
	}
});

Template.tokenlyRoomList.onRendered(function() {
	this.tokenlyRooms = new ReactiveVar([]);
});
