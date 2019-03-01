import { Meteor } from 'meteor/meteor';
import { ChatMessage } from 'meteor/rocketchat:models';
import { Notifications } from 'meteor/rocketchat:notifications';

Meteor.startup(function() {
	Notifications.onLogged('Users:Deleted', ({ userId }) =>
		ChatMessage.remove({
			'u._id': userId,
		})
	);
});
