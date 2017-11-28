import { Imports } from '../models/Imports';
import { RawImports } from '../models/RawImports';

Meteor.startup(function() {
	// Make sure all imports are marked as invalid, data clean up since you can't
	// restart an import at the moment.
	Imports.update({ valid: { $ne: false } }, { $set: { valid: false } }, { multi: true });

	// Clean up all the raw import data, since you can't restart an import at the moment
	try {
		RawImports.model.rawCollection().drop();
	} catch (e) {
		console.log('errror', e); //TODO: Remove
		// ignored
	}
});
