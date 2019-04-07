import { Meteor } from 'meteor/meteor';
import { CustomSounds } from '../../../models';

Meteor.methods({
	listCustomSounds() {
		return CustomSounds.find({}).fetch();
	},
});
