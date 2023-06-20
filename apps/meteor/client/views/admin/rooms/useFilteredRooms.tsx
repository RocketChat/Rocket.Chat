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

// TODO: ver um sort depois, pq a ordem vai ficar mudando toda vez, dependendo da sequencia que escolher o filtro
export const useFilteredRooms = (selectedOptions: OptionProp[], isLoading: boolean, rooms?: IRoom[]) => {
	if (isLoading || !rooms) return [];

	let filtered: IRoom[] = [];

	if (selectedOptions.length === 0) return rooms;

	console.log(rooms);

	selectedOptions.forEach((option) => {
		filtered = [...filtered, ...rooms.filter(filters[option.id])];
	});

	return filtered;
};
