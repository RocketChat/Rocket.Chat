import { Meteor } from 'meteor/meteor';
import { EmojiCustom } from 'meteor/rocketchat:models';

Meteor.methods({
	listEmojiCustom(options = {}) {
		return EmojiCustom.find(options).fetch();
	},
});
