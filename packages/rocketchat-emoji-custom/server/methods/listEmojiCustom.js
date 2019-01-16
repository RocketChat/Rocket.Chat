import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	listEmojiCustom(options = {}) {
		return RocketChat.models.EmojiCustom.find(options).fetch();
	},
});
