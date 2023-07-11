import type { IImport, IUser } from '@rocket.chat/core-typings';
import { Imports } from '@rocket.chat/models';

import { ProgressStep } from '../lib/ImporterProgressStep';
import type { ImporterInfo } from './definitions/ImporterInfo';

export const startImportOperation = async (info: ImporterInfo, userId: IUser['_id']): Promise<IImport> => {
	const importId = (
		await Imports.insertOne({
			type: info.name,
			importerKey: info.key,
			ts: new Date(),
			status: ProgressStep.NEW,
			valid: true,
			user: userId,
		})
	).insertedId;

	return Imports.findOne(importId);
};
