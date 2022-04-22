import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { CommentService } from '../services/comment/services';

Meteor.methods({
	async addComment(params) {
		check(
			params,
			Match.ObjectIncluding({
				content: String,
				blogId: String,
				parentId: String,
			}),
		);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addComment',
			});
		}

		const Comments = new CommentService();

		const comment = await Comments.create({ ...params, authorId: Meteor.userId() });

		return comment;
	},
});
