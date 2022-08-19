import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Rooms } from '@rocket.chat/models';
import type { IRoom } from '@rocket.chat/core-typings';

import { hasPermission, canAccessRoom } from '../../../authorization/server';
import { addUserToRoom } from '../functions';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';

type RoomJoinCode = (IRoom & { joinCodeRequired: boolean | null; joinCode: boolean | null }) | null;

Meteor.methods({
	async joinRoom(rid, code) {
		check(rid, String);

		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', 'joinRoom');
		}

		const room = (await Rooms.findOne({ _id: rid })) as RoomJoinCode;

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', 'joinRoom');
		}

		if (!roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.JOIN)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', 'joinRoom');
		}

		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', 'joinRoom');
		}
		if (room.joinCodeRequired === true && code !== room.joinCode && !hasPermission(user._id, 'join-without-join-code')) {
			throw new Meteor.Error('error-code-invalid', 'Invalid Room Password', 'joinRoom');
		}

		return addUserToRoom(rid, user);
	},
});
