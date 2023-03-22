import { Meteor } from 'meteor/meteor';
import { Imports } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IImport } from '@rocket.chat/core-typings';

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

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getLatestImportOperations(): IImport[];
	}
}

Meteor.methods<ServerMethods>({
	getLatestImportOperations() {
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
