import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Imports } from '@rocket.chat/models';
import { isStartImportParamsPOST, type StartImportParamsPOST } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { Importers } from '..';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export const executeStartImport = async ({ input }: StartImportParamsPOST, startedByUserId: IUser['_id']) => {
	const operation = await Imports.findLastImport();
	if (!operation) {
		throw new Meteor.Error('error-operation-not-found', 'Import Operation Not Found', 'startImport');
	}

	const { importerKey } = operation;
	const importer = Importers.get(importerKey);
	if (!importer) {
		throw new Meteor.Error('error-importer-not-defined', `The importer (${importerKey}) has no import class defined.`, 'startImport');
	}

	const instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

	await instance.startImport(input, startedByUserId);
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		startImport(params: StartImportParamsPOST): void;
	}
}

Meteor.methods<ServerMethods>({
	async startImport({ input }: StartImportParamsPOST) {
		if (!input || typeof input !== 'object' || !isStartImportParamsPOST({ input })) {
			throw new Meteor.Error(`Invalid Selection data provided to the importer.`);
		}

		const userId = Meteor.userId();
		// Takes name and object with users / channels selected to import
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', 'startImport');
		}

		if (!(await hasPermissionAsync(userId, 'run-import'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Importing is not allowed', 'startImport');
		}

		return executeStartImport({ input }, userId);
	},
});
