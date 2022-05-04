import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { TagService } from '../services/tag/service';

if (Meteor.isServer) {
	const Tags = new TagService();

	Meteor.publish('getPublishedTags', function (paginationOptions, queryOptions) {
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

		return Tags.list(paginationOptions, queryOptions);
	});
}
