import { Meteor } from 'meteor/meteor';
import { Imports } from '@rocket.chat/models';

import { ProgressStep } from '../../lib/ImporterProgressStep';

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
	} else {
		await Imports.invalidateAllOperations();
	}
});
