import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { TagService } from '../services/tag/service';

Meteor.methods({
	async getTags(paginationOptions, queryOptions) {
		check(
			paginationOptions,
			Match.ObjectIncluding({
				offset: Match.Optional(Number),
				count: Match.Optional(Number),
			}),
		);
		check(
			queryOptions,
			Match.ObjectIncluding({
				sort: Match.Optional(Object),
				query: Match.Optional(Object),
			}),
		);

		const Tags = new TagService();

		const results = await Tags.list(paginationOptions, queryOptions);

		return results;
	},
});
