RocketChat.Migrations.add({
	version: 76,
	up: () => {
		RocketChat.models.Subscriptions.find({ t: 'd' }).forEach((subscription) => {
			if (subscription && subscription.u && subscription.u._id) {
				const user = RocketChat.models.Users.findOneById(subscription.u._id);
				if (user && user.username && user.name) {
					RocketChat.models.Subscriptions.setAliasForDirectRoomsWithName(user.username, user.name);
				}
			}
		});
	}
});
