import type { IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../app/lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		openRoom(rid: IRoom['_id']): Promise<number>;
	}
}

Meteor.methods<ServerMethods>({
	async openRoom(rid) {
		check(rid, String);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'openRoom',
			});
		}

		const openByRoomResponse = await Subscriptions.openByRoomIdAndUserId(rid, uid);

		if (openByRoomResponse.modifiedCount) {
			void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, uid);
		}

		return openByRoomResponse.modifiedCount;
	},
});
