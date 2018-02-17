import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

import { authenticated } from '../../helpers/authenticated';
import schema from '../../schemas/messages/editMessage.graphqls';

const resolver = {
	Mutation: {
		editMessage: authenticated((root, { id, content }, { user }) => {
			const msg = RocketChat.models.Messages.findOneById(id.messageId);

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

			return RocketChat.models.Messages.findOneById(msg._id);
		})
	}
};

export {
	schema,
	resolver
};
