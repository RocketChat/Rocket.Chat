import { Meteor } from 'meteor/meteor';
import { Imports } from '@rocket.chat/models';

import { hasPermission } from '../../../authorization/server';

export const executeGetLatestImportOperations = async () => {
	const data = await Imports.find(
		{},
		{
			sort: { _updatedAt: -1 },
			limit: 20,
		},
	);

	return data.toArray();
};

Meteor.methods({
	async getLatestImportOperations() {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', 'getLatestImportOperations');
		}

		if (!hasPermission(userId, 'view-import-operations')) {
			throw new Meteor.Error('not_authorized', 'User not authorized', 'getLatestImportOperations');
		}

		return executeGetLatestImportOperations();
	},
});
