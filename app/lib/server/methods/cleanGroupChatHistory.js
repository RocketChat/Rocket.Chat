import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	cleanGroupChatHistory({ roomId }) {
		check(roomId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cleanChannelHistory' });
		}

		RocketChat.models.Messages.remove({
			rid: roomId,
		});
	},
});
