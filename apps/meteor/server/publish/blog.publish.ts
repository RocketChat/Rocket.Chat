import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { BlogService } from '../services/blog/services';

if (Meteor.isServer) {
	const Blogs = new BlogService();

	Meteor.publish('blogs.getList', function (limit) {
		check(limit, Match.Optional(Number));

		return Blogs.list(limit);
	});
}
