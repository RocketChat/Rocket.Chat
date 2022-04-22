import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { TagService } from '../services/tag/service';

Meteor.methods({
	async createTag(params) {
		check(
			params,
			Match.ObjectIncluding({
				title: String,
			}),
		);

		const Tags = new TagService();

		const tag = await Tags.create(params);

		return tag;
	},
});
