import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { ChatSubscription } from '../../app/models/client';

Meteor.methods<ServerMethods>({
	async toggleFavorite(rid, f) {
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
					f,
				},
			},
		);
	},
});
