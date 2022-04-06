import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { ChatMessage } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';

Meteor.startup(() => {
	Notifications.onLogged('Users:Deleted', ({ userId }: { userId: IUser['_id'] }) => {
		ChatMessage.remove({
			'u._id': userId,
		});
	});
});
