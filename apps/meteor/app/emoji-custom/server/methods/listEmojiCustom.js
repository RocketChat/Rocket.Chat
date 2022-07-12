import { Meteor } from 'meteor/meteor';
import { EmojiCustom } from '@rocket.chat/models';

Meteor.methods({
	async listEmojiCustom(options = {}) {
		return EmojiCustom.find(options).toArray();
	},
});
