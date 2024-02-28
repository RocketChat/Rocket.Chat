import { Subscriptions } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		hideRoom(rid: string): Promise<number>;
	}
}

export const hideRoomMethod = async (userId: string, rid: string): Promise<number> => {
	check(rid, String);

	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'hideRoom',
		});
	}

	return (await Subscriptions.hideByRoomIdAndUserId(rid, userId)).modifiedCount;
};

Meteor.methods<ServerMethods>({
	async hideRoom(rid) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'hideRoom',
			});
		}

		return hideRoomMethod(uid, rid);
	},
});
