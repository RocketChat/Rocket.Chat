import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';
import { deleteRoom } from '../../app/lib/server';
import { hasPermission } from '../../app/authorization/server';
import { Rooms, Messages } from '../../app/models/server';
import { Apps } from '../../app/apps/server';
import { roomCoordinator } from '../lib/rooms/roomCoordinator';
import { Team } from '../sdk';

Meteor.methods({
	async eraseRoom(rid: string) {
		methodDeprecationLogger.warn('eraseRoom will be deprecated in future versions of Rocket.Chat');

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'eraseRoom',
			});
		}

		const room = Rooms.findOneById(rid);

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

		if (!roomCoordinator.getRoomDirectives(room.t)?.canBeDeleted((permissionId, rid) => hasPermission(uid, permissionId, rid), room)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'eraseRoom',
			});
		}

		if (Apps?.isLoaded()) {
			const prevent = Promise.await(Apps.getBridges()?.getListenerBridge().roomEvent('IPreRoomDeletePrevent', room));
			if (prevent) {
				throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the room erasing.');
			}
		}

		const result = deleteRoom(rid);

		const team = room.teamId && (await Team.getOneById(room.teamId));

		if (team) {
			const user = Meteor.user();
			Messages.createUserDeleteRoomFromTeamWithRoomIdAndUser(team.roomId, room.name, user);
		}

		if (Apps?.isLoaded()) {
			Apps.getBridges()?.getListenerBridge().roomEvent('IPostRoomDeleted', room);
		}

		return result;
	},
});
