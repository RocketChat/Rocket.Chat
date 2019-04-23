import { Meteor } from 'meteor/meteor';
import { Messages } from '../../../../models';

import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/messages/addReactionToMessage.graphqls';

const resolver = {
	Mutation: {
		addReactionToMessage: authenticated((root, { id, icon, shouldReact }, { user }) => new Promise((resolve) => {
			Meteor.runAsUser(user._id, () => {
				Meteor.call('setReaction', icon, id.messageId, shouldReact, () => {
					resolve(Messages.findOne(id.messageId));
				});
			});
		})),
	},
};

export {
	schema,
	resolver,
};
