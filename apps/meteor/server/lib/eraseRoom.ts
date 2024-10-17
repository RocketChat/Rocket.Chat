import { AppEvents, Apps } from '@rocket.chat/apps';
import { Message, Team } from '@rocket.chat/core-services';
import { Rooms } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { deleteRoom } from '../../app/lib/server/functions/deleteRoom';
import { roomCoordinator } from './rooms/roomCoordinator';

export async function eraseRoom(rid: string, uid: string): Promise<void> {
	const room = await Rooms.findOneById(rid);

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'eraseRoom',
		});
	}

	if (room.federated) {
		throw new Meteor.Error('error-cannot-delete-federated-room', 'Cannot delete federated room', {
			method: 'eraseRoom',
		});
	}

	if (
		!(await roomCoordinator
			.getRoomDirectives(room.t)
			?.canBeDeleted((permissionId, rid) => hasPermissionAsync(uid, permissionId, rid), room))
	) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'eraseRoom',
		});
	}

	const team = room.teamId && (await Team.getOneById(room.teamId, { projection: { roomId: 1 } }));
	if (team && !(await hasPermissionAsync(uid, `delete-team-${room.t === 'c' ? 'channel' : 'group'}`, team.roomId))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'eraseRoom',
		});
	}

	if (Apps.self?.isLoaded()) {
		const prevent = await Apps.getBridges()?.getListenerBridge().roomEvent(AppEvents.IPreRoomDeletePrevent, room);
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the room erasing.');
		}
	}

	await deleteRoom(rid);

	if (team) {
		const user = await Meteor.userAsync();
		if (user) {
			await Message.saveSystemMessage('user-deleted-room-from-team', team.roomId, room.name || '', user);
		}
	}

	if (Apps.self?.isLoaded()) {
		void Apps.getBridges()?.getListenerBridge().roomEvent(AppEvents.IPostRoomDeleted, room);
	}
}
