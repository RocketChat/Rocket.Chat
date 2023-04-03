import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Message } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IRoom } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { callbacks } from '../../lib/callbacks';
import { Users } from '../../app/models/server';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../definition/IRoomTypeConfig';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		unmuteUserInRoom(data: { rid: IRoom['_id']; username: string }): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async unmuteUserInRoom(data) {
		const fromId = Meteor.userId();

		check(
			data,
			Match.ObjectIncluding({
				rid: String,
				username: String,
			}),
		);

		if (!fromId || !(await hasPermissionAsync(fromId, 'mute-user', data.rid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'unmuteUserInRoom',
			});
		}

		const room = await Rooms.findOneById(data.rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'unmuteUserInRoom',
			});
		}

		if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.MUTE, fromId))) {
			throw new Meteor.Error('error-invalid-room-type', `${room.t} is not a valid room type`, {
				method: 'unmuteUserInRoom',
				type: room.t,
			});
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUsername(data.rid, data.username, {
			projection: { _id: 1 },
		});

		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'unmuteUserInRoom',
			});
		}

		const unmutedUser = Users.findOneByUsernameIgnoringCase(data.username);

		const fromUser = Users.findOneById(fromId);

		callbacks.run('beforeUnmuteUser', { unmutedUser, fromUser }, room);

		await Rooms.unmuteUsernameByRoomId(data.rid, unmutedUser.username);

		await Message.saveSystemMessage('user-unmuted', data.rid, unmutedUser.username, fromUser);

		Meteor.defer(function () {
			callbacks.run('afterUnmuteUser', { unmutedUser, fromUser }, room);
		});

		return true;
	},
});
