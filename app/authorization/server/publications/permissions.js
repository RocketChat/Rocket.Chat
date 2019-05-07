import { Meteor } from 'meteor/meteor';
import Permissions from '../../../models/server/models/Permissions';
import { Notifications } from '../../../notifications';

Meteor.methods({
	'permissions/get'(updatedAt) {
		// TODO: should we return this for non logged users?
		// TODO: we could cache this collection

		const records = Permissions.find().fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter((record) => record._updatedAt > updatedAt),
				remove: Permissions.trashFindDeletedAfter(updatedAt, {}, { fields: { _id: 1, _deletedAt: 1 } }).fetch(),
			};
		}

		return records;
	},
});

Permissions.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			data = data || Permissions.findOneById(id);
			break;

		case 'removed':
			data = { _id: id };
			break;
	}

	Notifications.notifyLoggedInThisInstance('permissions-changed', clientAction, data);
});
