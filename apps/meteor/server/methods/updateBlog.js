import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { BlogService } from '../services/blog/services';

Meteor.methods({
	async updateBlog(blogId, params) {
		check(blogId, String);
		check(
			params,
			Match.ObjectIncluding({
				title: Match.Optional(String),
				authorId: Match.Optional(String),
				tags: Match.Optional([String]),
				content: Match.Optional(String),
			}),
		);

		const Blogs = new BlogService();

		const blog = await Blogs.update(blogId, params);

		return blog;
	},
});
