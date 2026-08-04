import { Meteor } from 'meteor/meteor';

import { PublicSettings } from '../../stores';

PublicSettings.use.subscribe((state) => {
	const removedIds = new Set(Object.keys(Meteor.settings)).difference(new Set(state.records.keys()));

	for (const _id of removedIds) {
		delete Meteor.settings[_id];
	}

	for (const setting of state.records.values()) {
		if (setting.value !== Meteor.settings[setting._id]) {
			Meteor.settings[setting._id] = setting.value;
		}
	}
});
