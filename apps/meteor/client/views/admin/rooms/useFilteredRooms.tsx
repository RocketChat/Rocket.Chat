import type { IRoom } from '@rocket.chat/core-typings';
import { isPublicRoom, isDiscussion, isTeamRoom, isDirectMessageRoom } from '@rocket.chat/core-typings';
import type { OptionProp } from '@rocket.chat/ui-client';

const filterRoomsByPrivate = (room: Partial<IRoom>): boolean => !isPublicRoom(room);
const filterRoomsByPublic = (room: Partial<IRoom>): boolean => isPublicRoom(room);

const filterRoomsByChannels = (room: Partial<IRoom>): boolean => room.t === 'c';
const filterRoomsByDirectMessages = (room: Partial<IRoom>): boolean => isDirectMessageRoom(room);
const filterRoomsByDiscussions = (room: Partial<IRoom>): boolean => isDiscussion(room);
const filterRoomsByOmnichannel = ({ t }: Partial<IRoom>): boolean => t === 'l'; // LiveChat
const filterRoomsByGroup = (room: Partial<IRoom>): boolean => room.t === 'p' && !isTeamRoom(room); // Group: private channel
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
	group: filterRoomsByGroup,
	teams: filterRoomsByTeams,
};

export const useFilteredRooms = (selectedOptions: OptionProp[], isLoading: boolean, rooms?: IRoom[]) => {
	if (isLoading || !rooms) return [];
	if (selectedOptions.length === 0) return rooms;

	let filtered: IRoom[] = [];

	selectedOptions.forEach((option) => {
		filtered = [...new Set([...filtered, ...rooms.filter(filters[option.id])])];
	});

	return filtered;
};
