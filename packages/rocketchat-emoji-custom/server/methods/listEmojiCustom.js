import { Meteor } from 'meteor/meteor';

Meteor.methods({
	listEmojiCustom() {
		return RocketChat.models.EmojiCustom.find({}).fetch();
	},
});
