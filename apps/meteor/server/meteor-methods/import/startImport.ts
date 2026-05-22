import type { IUser } from '@rocket.chat/core-typings';
import { Imports } from '@rocket.chat/models';
import { type StartImportParamsPOST } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { Importers } from '../../lib/import';

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
