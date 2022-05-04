import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { BlogService } from '../services/blog/services';

Meteor.methods({
	async getBlogs(limit) {
		check(limit, Match.Optional(Number));

		const Blogs = new BlogService();

		const result = await Blogs.list(limit).toArray();

		return result;
	},
});
