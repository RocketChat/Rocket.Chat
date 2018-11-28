import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	listEmojiCustom() {
		return RocketChat.models.EmojiCustom.find({}).fetch();
	},
});
