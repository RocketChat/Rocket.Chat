import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	listCustomSounds() {
		return RocketChat.models.CustomSounds.find({}).fetch();
	},
});
