import { Meteor } from 'meteor/meteor';

import { Imports } from '../../../models/server';
import { hasPermission } from '../../../authorization/server';

Meteor.methods({
	getLatestImportOperations() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getLatestImportOperations',
			});
		}

		if (!hasPermission(userId, 'view-import-operations')) {
			throw new Meteor.Error('not_authorized', 'User not authorized', {
				method: 'getLatestImportOperations',
			});
		}

		const data = Imports.find(
			{},
			{
				sort: { _updatedAt: -1 },
				limit: 20,
			},
		);

		return data.fetch();
	},
});
