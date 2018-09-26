RocketChat.Migrations.add({
	version: 133,
	up() {
		const subscriptions = RocketChat.models.Subscriptions.find({
			t: 'd',
			$or: [{
				ts: { $gte: new Date('2018-07-09T00:00:00Z') },
			}, {
				ts: null,
			}],
		});

		subscriptions.forEach((subscription) => {
			if (subscription.name !== subscription.fname) {
				return;
			}
			const user = RocketChat.models.Users.findOne({
				username: subscription.name,
			}, {
				fields: {
					name: 1,
				},
			});
			if (!user) {
				return;
			}
			RocketChat.models.Subscriptions.update({
				_id: subscription._id,
			}, {
				$set: {
					fname: user.name,
				},
			});
		});
	},
});
