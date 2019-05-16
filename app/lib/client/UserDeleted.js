import { Meteor } from 'meteor/meteor';

import { ChatMessage } from '../../models';
import { Notifications } from '../../notifications';

Meteor.startup(function() {
	Notifications.onLogged('Users:Deleted', ({ userId }) =>
		ChatMessage.remove({
			'u._id': userId,
		})
	);
});
