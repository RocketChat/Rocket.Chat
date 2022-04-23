import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { TagService } from '../services/tag/service';

Meteor.methods({
	async getOneTag(tagId) {
		check(tagId, String);

		const Tags = new TagService();

		const tag = await Tags.getTag(tagId);

		return tag;
	},
});
