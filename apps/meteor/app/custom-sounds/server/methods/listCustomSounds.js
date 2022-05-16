import { Meteor } from 'meteor/meteor';

import { CustomSounds } from '../../../models/server/raw';

Meteor.methods({
	async listCustomSounds() {
		return CustomSounds.find({}).toArray();
	},
});
