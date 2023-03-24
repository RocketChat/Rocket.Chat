import { Meteor } from 'meteor/meteor';
import { api } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IRoom } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { Rooms } from '../../../models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'e2e.requestSubscriptionKeys'(): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'e2e.requestSubscriptionKeys'() {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'requestSubscriptionKeys',
			});
		}

		// Get all encrypted rooms that the user is subscribed to and has no E2E key yet
		const subscriptions = await Subscriptions.findByUserIdWithoutE2E(userId).toArray();
		const roomIds = subscriptions.map((subscription) => subscription.rid);

		// For all subscriptions without E2E key, get the rooms that have encryption enabled
		const query = {
			e2eKeyId: {
				$exists: true,
			},
			_id: {
				$in: roomIds,
			},
		};

		const rooms: IRoom[] = Rooms.find(query);
		rooms.forEach((room) => {
			void api.broadcast('notify.e2e.keyRequest', room._id, room.e2eKeyId);
		});

		return true;
	},
});
