import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { markRoomAsRead } from '../lib/markRoomAsRead';
import { canAccessRoom } from '../../app/authorization/server';

Meteor.methods({
	markRoomAsRead(rid: IRoom['_id']): void {
		check(rid, String);

		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'markRoomAsRead',
			});
		}

		const room = Promise.await(Rooms.findOneById(rid));
		if (!room) {
			throw new Meteor.Error('error-room-not-found', 'Invalid room id', { method: 'markRoomAsRead' });
		}

		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'readMessages' });
		}

		Promise.await(markRoomAsRead(rid, user._id));
	},
});
