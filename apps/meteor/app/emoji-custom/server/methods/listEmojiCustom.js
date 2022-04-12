import { Meteor } from 'meteor/meteor';

import { EmojiCustom } from '../../../models/server/raw';

Meteor.methods({
	async listEmojiCustom(options = {}) {
		return EmojiCustom.find(options).toArray();
	},
});
