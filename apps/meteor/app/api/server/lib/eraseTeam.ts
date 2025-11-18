import { AppEvents, Apps } from '@rocket.chat/apps';
import { MeteorError, Team } from '@rocket.chat/core-services';
import type { AtLeast, IRoom, ITeam, IUser } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import { eraseRoom } from '../../../../server/lib/eraseRoom';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { deleteRoom } from '../../../lib/server/functions/deleteRoom';

type eraseRoomFnType = (rid: string, user: AtLeast<IUser, '_id' | 'username' | 'name'>) => Promise<boolean | void>;

export const eraseTeamShared = async (
	user: AtLeast<IUser, '_id' | 'username' | 'name'>,
	team: ITeam,
	roomsToRemove: IRoom['_id'][] = [],
	eraseRoomFn: eraseRoomFnType,
) => {
	const rooms: string[] = roomsToRemove.length
		? (await Team.getMatchingTeamRooms(team._id, roomsToRemove)).filter((roomId) => roomId !== team.roomId)
		: [];

	if (!user) {
		throw new MeteorError('Invalid user provided for erasing team', 'error-invalid-user', {
			method: 'eraseTeamShared',
		});
	}

	// If we got a list of rooms to delete along with the team, remove them first
	await Promise.all(rooms.map((room) => eraseRoomFn(room, user)));

	// Move every other room back to the workspace
	await Team.unsetTeamIdOfRooms(user, team);

	// Remove the team's main room
	await eraseRoomFn(team.roomId, user);

	// Delete all team memberships
	await Team.removeAllMembersFromTeam(team._id);

	// And finally delete the team itself
	await Team.deleteById(team._id);
};

export const eraseTeam = async (user: AtLeast<IUser, '_id' | 'username' | 'name'>, team: ITeam, roomsToRemove: IRoom['_id'][]) => {
	await eraseTeamShared(user, team, roomsToRemove, async (rid, user) => {
		return eraseRoom(rid, user._id);
	});
};

/**
 * @param team
 * @param roomsToRemove
 * @returns deleted room ids
 */
export const eraseTeamOnRelinquishRoomOwnerships = async (team: ITeam, roomsToRemove: IRoom['_id'][] = []): Promise<string[]> => {
	const deletedRooms = new Set<string>();
	await eraseTeamShared({ _id: 'rocket.cat', username: 'rocket.cat', name: 'Rocket.Cat' }, team, roomsToRemove, async (rid) => {
		const isDeleted = await eraseRoomLooseValidation(rid);
		if (isDeleted) {
			deletedRooms.add(rid);
		}
	});
	return Array.from(deletedRooms);
};

export async function eraseRoomLooseValidation(rid: string): Promise<boolean> {
	const room = await Rooms.findOneById(rid);

	if (!room) {
		return false;
	}

	if (room.federated) {
		return false;
	}

	if (Apps.self?.isLoaded()) {
		const prevent = await Apps.getBridges()?.getListenerBridge().roomEvent(AppEvents.IPreRoomDeletePrevent, room);
		if (prevent) {
			return false;
		}
	}

	try {
		await deleteRoom(rid);
	} catch (e) {
		SystemLogger.error(e);
		return false;
	}

	if (Apps.self?.isLoaded()) {
		void Apps.getBridges()?.getListenerBridge().roomEvent(AppEvents.IPostRoomDeleted, room);
	}

	return true;
}
