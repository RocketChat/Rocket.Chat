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

RocketChat.models.Permissions.on('change', ({action, id}) => {
	switch (action) {
		case 'update:record':
		case 'update:diff':
		case 'insert':
			const permission = RocketChat.models.Permissions.findOneById(id);
			RocketChat.Notifications.notifyLoggedInThisInstance('permissions-changed', (action === 'insert' ? 'inserted' : 'updated'), permission);
			break;

		case 'remove':
			RocketChat.Notifications.notifyLoggedInThisInstance('permissions-changed', 'removed', { _id: id });
			break;
	}
});
