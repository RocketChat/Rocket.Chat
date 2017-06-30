import { Meteor } from 'meteor/meteor';

import { authenticated } from '../../mocks/accounts/graphql-api';
import AccountsServer from '../../mocks/accounts/server';

export const schema = `
	type Mutation {
		editMessage(id: MessageIdentifier!, content: String!): Message
	}
`;

export const resolver = {
	Mutation: {
		editMessage: authenticated(AccountsServer, (root, { id, content }, { user, models }) => {
			const msg = models.Messages.findOneById(id.messageId);

			//Ensure the message exists
			if (!msg) {
				throw new Error(`No message found with the id of "${ id.messageId }".`);
			}

			if (id.channelId !== msg.rid) {
				throw new Error('The channel id provided does not match where the message is from.');
			}

			//Permission checks are already done in the updateMessage method, so no need to duplicate them
			Meteor.runAsUser(user._id, () => {
				Meteor.call('updateMessage', { _id: msg._id, msg: content, rid: msg.rid });
			});

			return models.Messages.findOneById(msg._id);
		})
	}
};
