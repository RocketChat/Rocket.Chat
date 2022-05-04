import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { BlogService } from '../services/blog/services';
import { BlogModel } from '../../app/models/server/raw';

Meteor.methods({
	async getBlogs(limit) {
		check(limit, Match.Optional(Number));

		const Blogs = new BlogService();
		const result = BlogModel.find;
		console.log(result, 'in the server');

		return BlogModel.find();
	},
});
