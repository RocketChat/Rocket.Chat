import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Message } from '@rocket.chat/core-services';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { callbacks } from '../../lib/callbacks';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../definition/IRoomTypeConfig';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		muteUserInRoom(data: { rid: IRoom['_id']; username: string }): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async muteUserInRoom(data) {
		check(
			data,
			Match.ObjectIncluding({
				rid: String,
				username: String,
			}),
		);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'muteUserInRoom',
			});
		}

		const fromId = Meteor.userId();

		if (!fromId || !(await hasPermissionAsync(fromId, 'mute-user', data.rid))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'muteUserInRoom',
			});
		}

		const room = await Rooms.findOneById(data.rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'muteUserInRoom',
			});
		}

		if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.MUTE, fromId))) {
			throw new Meteor.Error('error-invalid-room-type', `${room.t} is not a valid room type`, {
				method: 'muteUserInRoom',
				type: room.t,
			});
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUsername(data.rid, data.username, {
			projection: { _id: 1 },
		});
		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'muteUserInRoom',
			});
		}

		const mutedUser = await Users.findOneByUsernameIgnoringCase(data.username);

		if (!mutedUser?.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user to mute', {
				method: 'muteUserInRoom',
			});
		}

		const fromUser = await Users.findOneById(fromId);
		if (!fromUser) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'muteUserInRoom',
			});
		}

		await callbacks.run('beforeMuteUser', { mutedUser, fromUser }, room);

		await Rooms.muteUsernameByRoomId(data.rid, mutedUser.username);

		await Message.saveSystemMessage('user-muted', data.rid, mutedUser.username, fromUser);

		await callbacks.run('afterMuteUser', { mutedUser, fromUser }, room);

		return true;
	},
});
