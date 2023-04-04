import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Subscriptions } from '@rocket.chat/models';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		hideRoom(rid: string): Promise<number>;
	}
}

Meteor.methods<ServerMethods>({
	async hideRoom(rid) {
		check(rid, String);
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'hideRoom',
			});
		}

		return (await Subscriptions.hideByRoomIdAndUserId(rid, uid)).modifiedCount;
	},
});
