import { Meteor } from 'meteor/meteor';
import { EmojiCustom } from '../../../models';

Meteor.methods({
	listEmojiCustom(options = {}) {
		return EmojiCustom.find(options).fetch();
	},
});
