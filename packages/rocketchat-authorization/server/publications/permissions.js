Meteor.methods({
	'permissions/get'() {
		this.unblock();

		return RocketChat.models.Permissions.find().fetch();
	},

	'permissions/sync'(updatedAt) {
		this.unblock();

		return RocketChat.models.Permissions.dinamicFindChangesAfter('find', updatedAt);
	}
});


RocketChat.models.Permissions.on('change', (type, ...args) => {
	const records = RocketChat.models.Permissions.getChangedRecords(type, args[0]);

	for (const record of records) {
		RocketChat.Notifications.notifyAll('permissions-changed', type, record);
	}
});
