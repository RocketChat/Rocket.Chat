RocketChat.Migrations.add({
	version: 99,
	up() {
		return RocketChat.models.Subscriptions.find({ lastActivity: {$exists: false} }).forEach(item => {
			return RocketChat.models.Subscriptions.update({
				rid: item.rid
			}, {
				$set: {
					lastActivity: item.ls
				}
			});
		});
	}
});
