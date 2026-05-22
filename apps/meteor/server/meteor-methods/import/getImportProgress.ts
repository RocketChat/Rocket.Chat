import type { IImportProgress } from '@rocket.chat/core-typings';
import { Imports } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { Importers } from '../../lib/import';

export const executeGetImportProgress = async (): Promise<IImportProgress> => {
	const operation = await Imports.findLastImport();
	if (!operation) {
		throw new Meteor.Error('error-operation-not-found', 'Import Operation Not Found', 'getImportProgress');
	}

	const { importerKey } = operation;
	const importer = Importers.get(importerKey);
	if (!importer) {
		throw new Meteor.Error('error-importer-not-defined', `The importer (${importerKey}) has no import class defined.`, 'getImportProgress');
	}

	const instance = new importer.importer(importer, operation); // eslint-disable-line new-cap

	return instance.getProgress();
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getImportProgress(): IImportProgress;
	}
}
