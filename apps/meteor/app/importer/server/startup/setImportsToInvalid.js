import { Meteor } from 'meteor/meteor';
import { Imports, RawImports } from '@rocket.chat/models';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { ProgressStep } from '../../lib/ImporterProgressStep';

async function runDrop(fn) {
	try {
		await fn();
	} catch (e) {
		SystemLogger.error('error', e); // TODO: Remove
		// ignored
	}
}

Meteor.startup(async function () {
	const lastOperation = await Imports.findLastImport();
	let idToKeep = false;

	// If the operation is ready to start, or already started but failed
	// And there's still data for it on the temp collection
	// Then we can keep the data there to let the user try again
	if (lastOperation && [ProgressStep.USER_SELECTION, ProgressStep.ERROR].includes(lastOperation.status)) {
		idToKeep = lastOperation._id;
	}

	if (idToKeep) {
		await Imports.invalidateOperationsExceptId(idToKeep);

		// Clean up all the raw import data, except for the last operation
		await runDrop(() => RawImports.deleteMany({ import: { $ne: idToKeep } }));
	} else {
		await Imports.invalidateAllOperations();

		// Clean up all the raw import data
		await runDrop(() => RawImports.deleteMany({}));
	}
});
