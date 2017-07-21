import { Meteor } from 'meteor/meteor';

import { authenticated } from '../../helpers/authenticated';

export const schema = `
	type Mutation {
		addReactionToMassage(id: MessageIdentifier!, icon: String!): Message
	}
`;

export const resolver = {
	Mutation: {
		addReactionToMassage: authenticated((root, { id, icon }, { user }) => {
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
