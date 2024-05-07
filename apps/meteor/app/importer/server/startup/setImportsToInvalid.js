import { Imports } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { ProgressStep } from '../../lib/ImporterProgressStep';

Meteor.startup(async () => {
	const lastOperation = await Imports.findLastImport();

	// If the operation is still on "ready to start" state, we don't need to invalidate it.
	if (lastOperation && [ProgressStep.USER_SELECTION].includes(lastOperation.status)) {
		await Imports.invalidateOperationsExceptId(lastOperation._id);
		return;
	}

	await Imports.invalidateAllOperations();
});
