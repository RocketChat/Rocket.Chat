import { Meteor } from 'meteor/meteor';
import { CustomSounds } from 'meteor/rocketchat:models';

Meteor.methods({
	listCustomSounds() {
		return CustomSounds.find({}).fetch();
	},
});
