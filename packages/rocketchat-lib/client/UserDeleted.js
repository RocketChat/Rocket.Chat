import { Meteor } from 'meteor/meteor';
import { ChatMessage } from 'meteor/rocketchat:models';

Meteor.startup(function() {
	RocketChat.Notifications.onLogged('Users:Deleted', ({ userId }) =>
		ChatMessage.remove({
			'u._id': userId,
		})
	);
});
