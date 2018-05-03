import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/messages/addReactionToMessage.graphqls';

const resolver = {
	Mutation: {
		addReactionToMessage: authenticated((root, { id, icon }, { user }) => {
			return new Promise((resolve) => {
				Meteor.runAsUser(user._id, () => {
					Meteor.call('setReaction', id.messageId, icon, () => {
						resolve(RocketChat.models.Messages.findOne(id.messageId));
					});
				});
			});
		})
	}
};

export {
	schema,
	resolver
};
