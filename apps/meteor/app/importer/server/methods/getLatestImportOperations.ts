import type { IImport } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Imports } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

export const executeGetLatestImportOperations = async () => {
	const data = Imports.find(
		{},
		{
			sort: { _updatedAt: -1 },
			limit: 20,
		},
	);

	return data.toArray();
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getLatestImportOperations(): IImport[];
	}
}

Meteor.methods<ServerMethods>({
	async getLatestImportOperations() {
		methodDeprecationLogger.method('getLatestImportOperations', '9.0.0', '/v1/getLatestImportOperations');
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', 'getLatestImportOperations');
		}

		if (!(await hasPermissionAsync(userId, 'view-import-operations'))) {
			throw new Meteor.Error('not_authorized', 'User not authorized', 'getLatestImportOperations');
		}

		return executeGetLatestImportOperations();
	},
});
