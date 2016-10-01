Meteor.methods({
	'permissions/get'(updatedAt) {
		this.unblock();

		const records = RocketChat.models.Permissions.find().fetch();

		if (updatedAt instanceof Date) {
			return RocketChat.models.Permissions.dinamicFindChangesAfter('find', updatedAt);
		}

		return records;
	}
});


RocketChat.models.Permissions.on('change', (type, ...args) => {
	const records = RocketChat.models.Permissions.getChangedRecords(type, args[0]);

	for (const record of records) {
		RocketChat.Notifications.notifyAll('permissions-changed', type, record);
	}
});
