import type { IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../app/lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		toggleFavorite(rid: IRoom['_id'], favorite?: boolean): Promise<number>;
	}
}

export const toggleFavoriteMethod = async (userId: string, rid: IRoom['_id'], favorite?: boolean): Promise<number> => {
	const userSubscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);
	if (!userSubscription) {
		throw new Meteor.Error('error-invalid-subscription', 'You must be part of a room to favorite it', { method: 'toggleFavorite' });
	}

	const { modifiedCount } = await Subscriptions.setFavoriteByRoomIdAndUserId(rid, userId, favorite);

	if (modifiedCount) {
		void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, userId);
	}

	return modifiedCount;
};

Meteor.methods<ServerMethods>({
	async toggleFavorite(rid, favorite) {
		check(rid, String);
		check(favorite, Match.Optional(Boolean));
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'toggleFavorite',
			});
		}

		return toggleFavoriteMethod(userId, rid, favorite);
	},
});
