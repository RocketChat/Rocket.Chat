import { Meteor } from 'meteor/meteor';

import { ChatMessage, CachedChatMessage } from '../../models';
import { Notifications } from '../../notifications';

Meteor.startup(function() {
	Notifications.onLogged('Users:Deleted', ({ userId }) =>
		ChatMessage.remove({
			'u._id': userId,
		}, CachedChatMessage.save),
	);
});
