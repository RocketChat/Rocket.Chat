import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Subscriptions } from '@rocket.chat/models';

declare module '@rocket.chat/ui-contexts' {
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

		return (await Subscriptions.openByRoomIdAndUserId(rid, uid)).modifiedCount;
	},
});
