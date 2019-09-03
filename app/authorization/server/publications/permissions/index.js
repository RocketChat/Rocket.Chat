import { Meteor } from 'meteor/meteor';

import Permissions from '../../../../models/server/models/Permissions';
import './emitter';

Meteor.methods({
	'permissions/get'(updatedAt) {
		// TODO: should we return this for non logged users?
		if (updatedAt instanceof Date) {
			return {
				update: Permissions.findUpdatedAfter(updatedAt),
				remove: Permissions.trashFindDeletedAfter(
					updatedAt,
					{},
					{ fields: { _id: 1, _deletedAt: 1 } }
				).fetch(),
			};
		}

		return Permissions.find().fetch();
	},
});
