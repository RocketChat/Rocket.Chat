Meteor.methods({
	'permissions/get'(updatedAt) {
		this.unblock();

		const records = RocketChat.models.Permissions.find().fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter((record) => {
					return record._updatedAt > updatedAt;
				}),
				remove: RocketChat.models.Permissions.trashFindDeletedAfter(updatedAt, {}, {fields: {_id: 1, _deletedAt: 1}}).fetch()
			};
		}

		return records;
	}
});

// @TODO replace by `change`
RocketChat.models.Permissions.on('changed', (type, permission) => {
	RocketChat.Notifications.notifyLoggedInThisInstance('permissions-changed', type, permission);
});
