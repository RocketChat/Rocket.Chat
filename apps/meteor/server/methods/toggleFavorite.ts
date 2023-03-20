import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { IRoom } from '@rocket.chat/core-typings';

import { Subscriptions } from '../../app/models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		toggleFavorite(rid: IRoom['_id'], f?: boolean): number;
	}
}

Meteor.methods<ServerMethods>({
	toggleFavorite(rid, f) {
		check(rid, String);

		check(f, Match.Optional(Boolean));
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'toggleFavorite',
			});
		}

		const userSubscription = Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!userSubscription) {
			throw new Meteor.Error('error-invalid-subscription', 'You must be part of a room to favorite it', { method: 'toggleFavorite' });
		}

		return Subscriptions.setFavoriteByRoomIdAndUserId(rid, Meteor.userId(), f);
	},
});
