import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { CommentService } from '../services/comment/services';

Meteor.methods({
	async deleteComment(commentId) {
		check(commentId, String);

		const Comments = new CommentService();

		await Comments.delete(commentId);

		return true;
	},
});
