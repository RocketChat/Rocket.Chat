import { Meteor } from 'meteor/meteor';

import { Imports } from '../../../models';
import { RawImports } from '../models/RawImports';
import { ProgressStep } from '../../lib/ImporterProgressStep';

function runDrop(fn) {
	try {
		fn();
	} catch (e) {
		console.log('errror', e); // TODO: Remove
		// ignored
	}
}

Meteor.startup(function() {
	const lastOperation = Imports.findLastImport();
	let idToKeep = false;

	if (lastOperation && lastOperation.status === ProgressStep.USER_SELECTION) {
		// If there's still data about this operation on the temp collection, we can keep it pending
		if (RawImports.find({ import: lastOperation._id }).count() > 0) {
			idToKeep = lastOperation._id;
		}
	}

	if (idToKeep) {
		Imports.invalidateOperationsExceptId(idToKeep);

		// Clean up all the raw import data, except for the last operation
		runDrop(() => RawImports.model.rawCollection().remove({ import: { $ne: idToKeep } }));
	} else {
		Imports.invalidateAllOperations();

		// Clean up all the raw import data
		runDrop(() => RawImports.model.rawCollection().drop());
	}
});
