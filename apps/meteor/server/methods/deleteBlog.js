import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { BlogService } from '../services/blog/services';

Meteor.methods({
	async deleteBlog(blogId) {
		check(blogId, String);

		const Blogs = new BlogService();

		await Blogs.delete(blogId);

		return true;
	},
});
