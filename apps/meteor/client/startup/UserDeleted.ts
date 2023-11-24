import { Meteor } from 'meteor/meteor';

import { ChatMessage } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';

Meteor.startup(() => {
	Notifications.onLogged('Users:Deleted', ({ userId, messageErasureType, replaceByUser }) => {
		if (messageErasureType === 'Unlink' && replaceByUser) {
			return ChatMessage.update(
				{
					'u._id': userId,
				},
				{
					$set: {
						'alias': replaceByUser.alias,
						'u._id': replaceByUser._id,
						'u.username': replaceByUser.username,
						'u.name': undefined,
					},
				},
				{ multi: true },
			);
		}
		ChatMessage.remove({
			'u._id': userId,
		});
	});
});
