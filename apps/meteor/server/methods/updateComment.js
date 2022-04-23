import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { CommentService } from '../services/comment/services';

Meteor.methods({
	async updateComment(commentId, params) {
		check(commentId, String);
		check(
			params,
			Match.ObjectIncluding({
				authorId: Match.Optional(String),
				content: Match.Optional(String),
				blogId: Match.Optional(String),
				parentId: Match.Optional(String),
			}),
		);

		const Comments = new CommentService();

		const comment = await Comments.update(commentId, params);

		return comment;
	},
});
