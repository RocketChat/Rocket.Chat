RocketChat.Migrations.add({
	version: 60,
	up() {
		let subscriptions = RocketChat.models.Subscriptions.find({ $or: [ { name: { $exists: 0 } }, { name: { $not: { $type: 2 } } } ] }).fetch();
		if (subscriptions && subscriptions.length > 0) {
			RocketChat.models.Subscriptions.remove({ _id: { $in: _.pluck(subscriptions, '_id') } });
		}

		subscriptions = RocketChat.models.Subscriptions.find().forEach(function(subscription) {
			const user = RocketChat.models.Users.findOne({ _id: subscription && subscription.u && subscription.u._id });
			if (!user) {
				RocketChat.models.Subscriptions.remove({ _id: subscription._id });
			}
		});
	}
});
