import { Meteor } from 'meteor/meteor';

Meteor.methods({
	listCustomSounds() {
		return RocketChat.models.CustomSounds.find({}).fetch();
	},
});
