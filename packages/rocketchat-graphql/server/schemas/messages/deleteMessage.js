import { Meteor } from 'meteor/meteor';

import { authenticated } from '../../mocks/accounts/graphql-api';
import AccountsServer from '../../mocks/accounts/server';

export const schema = `
	type Mutation {
		deleteMessage(id: MessageIdentifier!): Message
	}
`;

export const resolver = {
	Mutation: {
		deleteMessage: authenticated(AccountsServer, (root, { id }, { models, user }) => {
			const msg = models.Messages.findOneById(id.messageId, { fields: { u: 1, rid: 1 }});

			if (!msg) {
				throw new Error(`No message found with the id of "${ id.messageId }".`);
			}

			if (id.channelId !== msg.rid) {
				throw new Error('The room id provided does not match where the message is from.');
			}

			Meteor.runAsUser(user._id, () => {
				Meteor.call('deleteMessage', { _id: msg._id });
			});

			return msg;
		})
	}
};
