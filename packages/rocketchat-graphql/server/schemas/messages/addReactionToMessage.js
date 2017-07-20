import { Meteor } from 'meteor/meteor';
import { authenticated } from '@accounts/graphql-api';
import AccountsServer from '@accounts/server';

export const schema = `
	type Mutation {
		addReactionToMassage(id: MessageIdentifier!, icon: String!): Message
	}
`;

export const resolver = {
	Mutation: {
		addReactionToMassage: authenticated(AccountsServer, (root, { id, icon }, { models, user }) => {
			return new Promise((resolve) => {
				Meteor.runAsUser(user._id, () => {
					Meteor.call('setReaction', id.messageId, icon, () => {
						resolve(models.findOne(id.messageId));
					});
				});
			});
		})
	}
};
