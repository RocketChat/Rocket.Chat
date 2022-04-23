import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { BlogService } from '../services/blog/services';

Meteor.methods({
	async createBlog(params) {
		check(
			params,
			Match.ObjectIncluding({
				title: String,
				content: String,
				tags: Match.Optional([String]),
			}),
		);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addComment',
			});
		}

		const Blogs = new BlogService();

		const blog = await Blogs.create({ ...params, authorId: Meteor.userId() });

		return blog;
	},
});
