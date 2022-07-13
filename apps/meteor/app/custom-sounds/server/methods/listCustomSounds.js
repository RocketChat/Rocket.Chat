import { Meteor } from 'meteor/meteor';
import { CustomSounds } from '@rocket.chat/models';

Meteor.methods({
	async listCustomSounds() {
		return CustomSounds.find({}).toArray();
	},
});
