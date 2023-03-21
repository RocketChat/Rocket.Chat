import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Subscriptions } from '../../app/models/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		openRoom(rid: IRoom['_id']): number;
	}
}

Meteor.methods<ServerMethods>({
	openRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'openRoom',
			});
		}

		return Subscriptions.openByRoomIdAndUserId(rid, Meteor.userId());
	},
});
