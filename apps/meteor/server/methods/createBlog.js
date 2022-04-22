import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { BlogService } from '../services/blog/services';

Meteor.methods({
	async createBlog(params) {
		check(
			params,
			Match.ObjectIncluding({
				title: String,
				authorId: String,
				content: String,
				tags: Match.Optional([String]),
			}),
		);

		const Blogs = new BlogService();

		const blog = await Blogs.create(params);

		return blog;
	},
});
