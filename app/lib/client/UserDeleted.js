import { Meteor } from 'meteor/meteor';
import { ChatMessage } from '/app/models';
import { Notifications } from '/app/notifications';

Meteor.startup(function() {
	Notifications.onLogged('Users:Deleted', ({ userId }) =>
		ChatMessage.remove({
			'u._id': userId,
		})
	);
});
