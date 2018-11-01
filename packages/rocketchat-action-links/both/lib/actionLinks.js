import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

// Action Links namespace creation.
RocketChat.actionLinks = {
	actions: {},
	register(name, funct) {
		RocketChat.actionLinks.actions[name] = funct;
	},
	getMessage(name, messageId) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: 'actionLinks.getMessage' });
		}

		const message = RocketChat.models.Messages.findOne({ _id: messageId });
		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Invalid message', { function: 'actionLinks.getMessage' });
		}

		const subscription = RocketChat.models.Subscriptions.findOne({
			rid: message.rid,
			'u._id': userId,
		});
		if (!subscription) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { function: 'actionLinks.getMessage' });
		}

		if (!message.actionLinks || !message.actionLinks[name]) {
			throw new Meteor.Error('error-invalid-actionlink', 'Invalid action link', { function: 'actionLinks.getMessage' });
		}

		return message;
	},
};
