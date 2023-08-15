import type { IRoom } from '@rocket.chat/core-typings';
import { isDiscussion, isTeamRoom, isDirectMessageRoom } from '@rocket.chat/core-typings';
import type { OptionProp } from '@rocket.chat/ui-client';

const filterRoomsByChannels = (room: Partial<IRoom>): boolean =>
	(room.t === 'c' || room.t === 'p') && !isDiscussion(room) && !isTeamRoom(room); // can be a public channel or a private channel (group)
const filterRoomsByDirectMessages = (room: Partial<IRoom>): boolean => isDirectMessageRoom(room);
const filterRoomsByDiscussions = (room: Partial<IRoom>): boolean => isDiscussion(room);
const filterRoomsByOmnichannel = ({ t }: Partial<IRoom>): boolean => t === 'l'; // LiveChat
const filterRoomsByTeams = (room: Partial<IRoom>): boolean => isTeamRoom(room);

const filters: Record<string, (room: Partial<IRoom>) => boolean> = {
	channels: filterRoomsByChannels,
	directMessages: filterRoomsByDirectMessages,
	discussions: filterRoomsByDiscussions,
	omnichannel: filterRoomsByOmnichannel,
	teams: filterRoomsByTeams,
};

export const useFilteredTypeRooms = (selectedOptions: OptionProp[], isLoading: boolean, rooms?: IRoom[]) => {
	if (isLoading || !rooms) return [];
	if (selectedOptions.length === 0) return rooms;

	let filtered: IRoom[] = [];

	selectedOptions.forEach((option) => {
		filtered = [...new Set([...filtered, ...rooms.filter(filters[option.id])])];
	});

	return filtered;
};
