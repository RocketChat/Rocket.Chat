import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { BlogService } from '../services/blog/services';

Meteor.methods({
	async getOneBlog(blogId) {
		check(blogId, String);

		const Blogs = new BlogService();

		const blog = await Blogs.getBlog(blogId);

		return blog;
	},
});
