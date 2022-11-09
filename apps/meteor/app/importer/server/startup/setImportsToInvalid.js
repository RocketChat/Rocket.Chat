import { Meteor } from 'meteor/meteor';

import { Imports } from '../../../models/server';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { RawImports } from '../models/RawImports';
import { ProgressStep } from '../../lib/ImporterProgressStep';

function runDrop(fn) {
	try {
		fn();
	} catch (e) {
		SystemLogger.error('error', e); // TODO: Remove
		// ignored
	}
}

Meteor.startup(function () {
	const lastOperation = Imports.findLastImport();
	let idToKeep = false;

	// If the operation is ready to start, or already started but failed
	// And there's still data for it on the temp collection
	// Then we can keep the data there to let the user try again
	if (lastOperation && [ProgressStep.USER_SELECTION, ProgressStep.ERROR].includes(lastOperation.status)) {
		idToKeep = lastOperation._id;
	}

	if (idToKeep) {
		Imports.invalidateOperationsExceptId(idToKeep);

		// Clean up all the raw import data, except for the last operation
		runDrop(() => RawImports.model.rawCollection().deleteMany({ import: { $ne: idToKeep } }));
	} else {
		Imports.invalidateAllOperations();

		// Clean up all the raw import data
		runDrop(() => RawImports.model.rawCollection().deleteMany({}));
	}
});
