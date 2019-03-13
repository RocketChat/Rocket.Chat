import { Meteor } from 'meteor/meteor';
import { EmojiCustom } from '/app/models';

Meteor.methods({
	listEmojiCustom(options = {}) {
		return EmojiCustom.find(options).fetch();
	},
});
