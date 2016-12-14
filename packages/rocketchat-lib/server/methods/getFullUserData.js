Meteor.methods({
	getFullUserData({ filter = '', limit }) {
		const result = RocketChat.getFullUserData({ userId: Meteor.userId(), filter, limit });

		if (!result) {
			return result;
		}

		return result.fetch();
	}
});
