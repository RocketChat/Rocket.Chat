import type { IRoom } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		toggleFavorite(rid: IRoom['_id'], f?: boolean): Promise<number>;
	}
}

Meteor.methods<ServerMethods>({
	async toggleFavorite(rid, f) {
		check(rid, String);
		check(f, Match.Optional(Boolean));
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'toggleFavorite',
			});
		}

		const userSubscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);
		if (!userSubscription) {
			throw new Meteor.Error('error-invalid-subscription', 'You must be part of a room to favorite it', { method: 'toggleFavorite' });
		}

		return (await Subscriptions.setFavoriteByRoomIdAndUserId(rid, userId, f)).modifiedCount;
	},
});
