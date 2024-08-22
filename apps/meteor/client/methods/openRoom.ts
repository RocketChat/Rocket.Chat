import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { ChatSubscription } from '../../app/models/client';

Meteor.methods<ServerMethods>({
	async openRoom(rid) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'openRoom',
			});
		}

		return ChatSubscription.update(
			{
				rid,
				'u._id': Meteor.userId(),
			},
			{
				$set: {
					open: true,
				},
			},
		);
	},
});
