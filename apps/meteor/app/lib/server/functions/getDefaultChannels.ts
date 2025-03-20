import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

export async function getDefaultChannels(): Promise<IRoom[]> {
	const defaultRooms = await Rooms.findByDefaultAndTypes(true, ['c', 'p'], {
		projection: { usernames: 0 },
	}).toArray();
	const roomsThatAreGoingToBeJoined = new Set(defaultRooms.map((room) => room._id));

	// If any of those are teams, we need to get all the channels that have the auto-join flag as well
	const teamRooms = defaultRooms.filter((room) => room.teamMain && room.teamId);
	if (teamRooms.length > 0) {
		for await (const teamRoom of teamRooms) {
			const defaultTeamRooms = await Rooms.findDefaultRoomsForTeam(teamRoom.teamId).toArray();

			const defaultTeamRoomsThatWereNotAlreadyAdded = defaultTeamRooms.filter((channel) => !roomsThatAreGoingToBeJoined.has(channel._id));

			defaultTeamRoomsThatWereNotAlreadyAdded.forEach((channel) => roomsThatAreGoingToBeJoined.add(channel._id));
			// Add the channels to the defaultRooms list
			defaultRooms.push(...defaultTeamRoomsThatWereNotAlreadyAdded);
		}
	}

	return defaultRooms;
}
