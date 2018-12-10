import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { ChatMessage } from 'meteor/rocketchat:ui';

Meteor.methods({
	starMessage(message) {
		if (!Meteor.userId()) {
			return false;
		}
		if (RocketChat.models.Subscriptions.findOne({ rid: message.rid }) == null) {
			return false;
		}
		if (!RocketChat.settings.get('Message_AllowStarring')) {
			return false;
		}
		return ChatMessage.update({
			_id: message._id,
		}, {
			$set: {
				starred: !!message.starred,
			},
		});
	},
});
