import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { TagService } from '../services/tag/service';

Meteor.methods({
	async deleteTag(tagId) {
		check(tagId, String);

		const Tags = new TagService();

		await Tags.delete(tagId);

		return true;
	},
});
