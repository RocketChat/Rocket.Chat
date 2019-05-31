import { Meteor } from 'meteor/meteor';

import Permissions from '../../../models/server/models/Permissions';
import Settings from '../../../models/server/models/Settings';

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

	if (data.level && data.level === 'setting') {
		// if the permission changes, the effect on the visible settings depends on the role affected.
		// The selected-settings-based consumers have to react accordingly and either add or remove the
		// setting from the user's collection
		const setting = Settings.findOneById(data.settingId);
		Notifications.notifyLoggedInThisInstance('private-settings-changed', 'auth', setting);
	}

	Notifications.notifyLoggedInThisInstance('permissions-changed', clientAction, data);
});
