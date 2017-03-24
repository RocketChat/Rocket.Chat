RocketChat.Migrations.add({
	version: 59,
	up() {
		const users = RocketChat.models.Users.find({}, { sort: { createdAt: 1 }, limit: 1 }).fetch();
		if (users && users.length > 0) {
			const createdAt = users[0].createdAt;
			RocketChat.models.Settings.update({ createdAt: { $exists: 0 } }, { $set: { createdAt } }, { multi: true });
			RocketChat.models.Statistics.update({ installedAt: { $exists: 0 } }, { $set: { installedAt: createdAt } }, { multi: true });
		}
	}
});
