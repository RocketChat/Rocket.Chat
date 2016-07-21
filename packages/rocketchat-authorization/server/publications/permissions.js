Meteor.methods({
	'permissions/get'(updatedAt) {
		this.unblock();

		if (updatedAt instanceof Date) {
			return RocketChat.models.Permissions.dinamicFindChangesAfter('find', updatedAt);
		}

		return RocketChat.models.Permissions.find().fetch();
	}
});


RocketChat.models.Permissions.on('change', (type, ...args) => {
	const records = RocketChat.models.Permissions.getChangedRecords(type, args[0]);

	for (const record of records) {
		RocketChat.Notifications.notifyAll('permissions-changed', type, record);
	}
});
