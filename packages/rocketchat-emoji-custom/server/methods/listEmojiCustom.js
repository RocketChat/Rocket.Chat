import { Meteor } from 'meteor/meteor';
import { EmojiCustom } from 'meteor/rocketchat:models';

Meteor.methods({
	listEmojiCustom(options = {}, updatedAt) {
		const records = EmojiCustom.find(options).fetch();

		if (updatedAt instanceof Date) {
			return {
				update: records.filter((record) => record._updatedAt > updatedAt),
				remove: EmojiCustom.trashFindDeletedAfter(updatedAt).fetch(),
			};
		}

		return records;
	},
});
