import { Meteor } from 'meteor/meteor';
import { CustomSounds } from '/app/models';

Meteor.methods({
	listCustomSounds() {
		return CustomSounds.find({}).fetch();
	},
});
