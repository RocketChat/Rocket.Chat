import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/messages/addReactionToMessage.graphqls';

const resolver = {
	Mutation: {
		addReactionToMessage: authenticated((root, { id, icon, shouldReact }, { user }) => new Promise((resolve) => {
			Meteor.runAsUser(user._id, () => {
				Meteor.call('setReaction', icon, id.messageId, shouldReact, () => {
					resolve(RocketChat.models.Messages.findOne(id.messageId));
				});
			});
		})),
	},
};

export {
	schema,
	resolver,
};
