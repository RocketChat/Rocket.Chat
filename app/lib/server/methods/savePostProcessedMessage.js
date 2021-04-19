import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../models';

Meteor.methods({
	savePostProcessedMessage(_id, message) {
		const originalMessage = Messages.findOneById(_id);

		if (!originalMessage || !originalMessage._id) {
			return;
		}

		return Messages.updatePostProcessedPushMessageById(_id, message);
	},
});
