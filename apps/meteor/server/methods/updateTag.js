import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { TagService } from '../services/tag/service';

Meteor.methods({
	async updateTag(tagId, params) {
		check(tagId, String);
		check(
			params,
			Match.ObjectIncluding({
				title: Match.Optional(String),
			}),
		);

		const Tags = new TagService();

		const tag = await Tags.update(tagId, params);

		return tag;
	},
});
