Meteor.methods({
	'permissions/get'(updatedAt) {
		this.unblock();

		const records = RocketChat.cache.Permissions.find().fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter((record) => {
					return record._updatedAt > updatedAt;
				})
			};
		}

		return records;
	}
});


RocketChat.cache.Permissions.on('changed', (type, permission) => {
	permission = RocketChat.cache.Subscriptions.processQueryOptionsOnResult(permission);

	RocketChat.Notifications.notifyAll('permissions-changed', type, permission);
});
