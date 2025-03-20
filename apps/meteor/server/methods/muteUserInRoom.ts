import { Message } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';
import { notifyOnRoomChangedById } from '../../app/lib/server/lib/notifyListener';
import { RoomMemberActions } from '../../definition/IRoomTypeConfig';
import { callbacks } from '../../lib/callbacks';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		muteUserInRoom(data: { rid: IRoom['_id']; username: string }): boolean;
	}
}

export const muteUserInRoom = async (fromId: string, data: { rid: IRoom['_id']; username: string }): Promise<boolean> => {
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

	if (room.ro) {
		await Rooms.muteReadOnlyUsernameByRoomId(data.rid, mutedUser.username);
	} else {
		await Rooms.muteUsernameByRoomId(data.rid, mutedUser.username);
	}

	await Message.saveSystemMessage('user-muted', data.rid, mutedUser.username, fromUser);

	await callbacks.run('afterMuteUser', { mutedUser, fromUser }, room);

	void notifyOnRoomChangedById(data.rid);

	return true;
};

Meteor.methods<ServerMethods>({
	async muteUserInRoom(data) {
		methodDeprecationLogger.method('muteUserInRoom', '8.0.0');

		check(
			data,
			Match.ObjectIncluding({
				rid: String,
				username: String,
			}),
		);

		const fromId = Meteor.userId();

		if (!fromId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'muteUserInRoom',
			});
		}

		return muteUserInRoom(fromId, data);
	},
});
