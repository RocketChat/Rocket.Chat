import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { ChatSubscription } from '../../app/models/client';

Meteor.methods<ServerMethods>({
	async hideRoom(rid) {
		if (!Meteor.userId()) {
			return 0;
		}

		return ChatSubscription.update(
			{
				rid,
				'u._id': Meteor.userId(),
			},
			{
				$set: {
					alert: false,
					open: false,
				},
			},
		);
	},
});
