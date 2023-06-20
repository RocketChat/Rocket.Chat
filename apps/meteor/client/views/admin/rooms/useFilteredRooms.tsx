import type { IRoom } from '@rocket.chat/core-typings';
import { isPublicRoom, isDiscussion, isTeamRoom } from '@rocket.chat/core-typings';

import type { OptionProp } from './DropDown/CustomDropDown';

const filterRoomsByPrivate = (room: Partial<IRoom>): boolean => !isPublicRoom(room);
const filterRoomsByPublic = (room: Partial<IRoom>): boolean => isPublicRoom(room);

const filterRoomsByChannels = ({ t }: Partial<IRoom>): boolean => t === 'c';
const filterRoomsByDirectMessages = ({ t }: Partial<IRoom>): boolean => t === 'd';
const filterRoomsByDiscussions = (room: Partial<IRoom>): boolean => isDiscussion(room);
const filterRoomsByOmnichannel = ({ t }: Partial<IRoom>): boolean => t === 'l'; // LiveChat
const filterRoomsByTeams = (room: Partial<IRoom>): boolean => isTeamRoom(room);

const filters: Record<string, (room: Partial<IRoom>) => boolean> = {
	// Visibility
	private: filterRoomsByPrivate,
	public: filterRoomsByPublic,
	// RoomType
	channels: filterRoomsByChannels,
	directMessages: filterRoomsByDirectMessages,
	discussions: filterRoomsByDiscussions,
	omnichannel: filterRoomsByOmnichannel,
	teams: filterRoomsByTeams,
};

function arrayUnique(array: IRoom[]) {
	const a = array.concat();
	for (let i = 0; i < a.length; ++i) {
		for (let j = i + 1; j < a.length; ++j) {
			if (a[i]._id === a[j]._id) a.splice(j--, 1);
		}
	}

	return a;
}

// TODO: ver um sort depois, pq a ordem vai ficar mudando toda vez, dependendo da sequencia que escolher o filtro
export const useFilteredRooms = (selectedOptions: OptionProp[], isLoading: boolean, rooms?: IRoom[]) => {
	if (isLoading || !rooms) return [];
	if (selectedOptions.length === 0) return rooms;

	let filtered: IRoom[] = [];

	console.log(rooms);

	selectedOptions.forEach((option) => {
		filtered = arrayUnique(filtered.concat(rooms.filter(filters[option.id])));
	});

	console.log(filtered);

	return filtered;
};
