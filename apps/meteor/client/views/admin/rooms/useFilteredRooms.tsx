import type { IRoom } from '@rocket.chat/core-typings';
import { isPublicRoom, isDiscussion, isTeamRoom, isDirectMessageRoom } from '@rocket.chat/core-typings';
import type { OptionProp } from '@rocket.chat/ui-client';

const filterRoomsByPrivate = (room: Partial<IRoom>): boolean => !isPublicRoom(room);
const filterRoomsByPublic = (room: Partial<IRoom>): boolean => isPublicRoom(room);

const filterRoomsByChannels = (room: Partial<IRoom>): boolean => room.t === 'c';
const filterRoomsByDirectMessages = (room: Partial<IRoom>): boolean => isDirectMessageRoom(room);
const filterRoomsByDiscussions = (room: Partial<IRoom>): boolean => isDiscussion(room);
const filterRoomsByOmnichannel = ({ t }: Partial<IRoom>): boolean => t === 'l'; // LiveChat
const filterRoomsByTeams = (room: Partial<IRoom>): boolean => isTeamRoom(room);

const RoomTypefilters: Record<string, (room: Partial<IRoom>) => boolean> = {
	channels: filterRoomsByChannels,
	directMessages: filterRoomsByDirectMessages,
	discussions: filterRoomsByDiscussions,
	omnichannel: filterRoomsByOmnichannel,
	teams: filterRoomsByTeams,
};

const RoomVisibilityfilters: Record<string, (room: Partial<IRoom>) => boolean> = {
	private: filterRoomsByPrivate,
	public: filterRoomsByPublic,
};

function intersect(array1: IRoom[], array2: IRoom[]) {
	if (array1.length === 0) return array2;
	if (array2.length === 0) return array1;

	const set2 = new Set(array2);

	return [...new Set(array1)].filter((x) => set2.has(x));
}

export const useFilteredRooms = (selectedOptions: OptionProp[], isLoading: boolean, rooms?: IRoom[]) => {
	if (isLoading || !rooms) return [];
	if (selectedOptions.length === 0) return rooms;

	let filteredTypes: IRoom[] = [];
	let filteredVisibilities: IRoom[] = [];

	selectedOptions.forEach((option) => {
		if (option.id === 'public' || option.id === 'private') {
			filteredVisibilities = [...new Set([...filteredVisibilities, ...rooms.filter(RoomVisibilityfilters[option.id])])];
		} else {
			filteredTypes = [...new Set([...filteredTypes, ...rooms.filter(RoomTypefilters[option.id])])];
		}
	});

	console.log(`types: ${filteredTypes}`);
	console.log(`visibilites: ${filteredVisibilities}`);

	const result = intersect(filteredVisibilities, filteredTypes);

	console.log(`intersect: ${result}`);

	return result;
};
