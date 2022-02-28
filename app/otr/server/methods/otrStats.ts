import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { Settings, Rooms } from '../../../models/server';

Meteor.methods({
	otrEnded(rid) {
		if (rid) {
			const otrCount = settings.get('OTR_Count');
			if (typeof otrCount !== 'number') {
				return;
			}
			Settings.updateValueById('OTR_Count', otrCount + 1);

			Rooms.update({ _id: rid }, { $set: { createdOTR: true } });
		}
	},
});
