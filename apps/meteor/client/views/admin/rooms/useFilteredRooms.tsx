import type { IRoom } from '@rocket.chat/core-typings';
import { isPublicRoom, isDiscussion, isTeamRoom, isDirectMessageRoom } from '@rocket.chat/core-typings';

import type { OptionProp } from './DropDown/CustomDropDown';

const filterRoomsByPrivate = (room: Partial<IRoom>): boolean => !isPublicRoom(room);
const filterRoomsByPublic = (room: Partial<IRoom>): boolean => isPublicRoom(room);

const filterRoomsByChannels = (room: Partial<IRoom>): boolean => room.t === 'c' || room.channel !== undefined;
const filterRoomsByDirectMessages = (room: Partial<IRoom>): boolean => isDirectMessageRoom(room);
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

// TODO: criar interface que aceite selectOption??

// TODO: ver um sort depois, pq a ordem vai ficar mudando toda vez, dependendo da sequencia que escolher o filtro
export const useFilteredRooms = (selectedOptions: OptionProp[], isLoading: boolean, rooms?: IRoom[]) => {
	if (isLoading || !rooms) return [];
	if (selectedOptions.length === 0) return rooms;

	let filtered: IRoom[] = [];

	console.log(`Rooms: ${rooms}`);

	selectedOptions.forEach((option) => {
		filtered = [...new Set([...filtered, ...rooms.filter(filters[option.id])])];
	});

	console.log(`Filtered rooms: ${filtered}`);

	return filtered;
};

/*
	Instead of creating a custom function to remove repeated items from the array of filtered elements, we can use the ES6 Set feature, which takes an array, but skips the duplicates, because every element in a set must be unique in the collection.

	When creating a Set keep in mind that null is treated like undefined and that it is a different concept from an array: a Set is a “keyed collection” while the second is an “indexed collection”
*/
