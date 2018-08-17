Meteor.methods({
	'permissions/get'(updatedAt) {
		this.unblock();
		// TODO: should we return this for non logged users?
		// TODO: we could cache this collection

		const records = RocketChat.models.Permissions.find().fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter((record) => record._updatedAt > updatedAt),
				remove: RocketChat.models.Permissions.trashFindDeletedAfter(updatedAt, {}, { fields: { _id: 1, _deletedAt: 1 } }).fetch(),
			};
		}

		return records;
	},
});

RocketChat.models.Permissions.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			data = data || RocketChat.models.Permissions.findOneById(id);
			break;

		case 'removed':
			data = { _id: id };
			break;
	}

	RocketChat.Notifications.notifyLoggedInThisInstance('permissions-changed', clientAction, data);
});
