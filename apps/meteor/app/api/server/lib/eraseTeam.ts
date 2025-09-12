import { Team } from '@rocket.chat/core-services';
import type { IRoom, ITeam, IUser } from '@rocket.chat/core-typings';

import { eraseRoom } from '../../../../server/lib/eraseRoom';

export const eraseTeam = async (userId: IUser['_id'], team: ITeam, roomsToRemove: IRoom['_id'][]) => {
	const rooms: string[] = await Team.getMatchingTeamRooms(team._id, roomsToRemove);

	// If we got a list of rooms to delete along with the team, remove them first
	if (rooms.length) {
		for await (const room of rooms) {
			await eraseRoom(room, userId);
		}
	}

	// Move every other room back to the workspace
	await Team.unsetTeamIdOfRooms(userId, team._id);

	// Remove the team's main room
	await eraseRoom(team.roomId, userId);

	// Delete all team memberships
	await Team.removeAllMembersFromTeam(team._id);

	// And finally delete the team itself
	await Team.deleteById(team._id);
};
