import type { IRoom } from '@rocket.chat/core-typings';
import { isPublicRoom } from '@rocket.chat/core-typings';
import type { OptionProp } from '@rocket.chat/ui-client';

const filterRoomsByPrivate = (room: Partial<IRoom>): boolean => !isPublicRoom(room);
const filterRoomsByPublic = (room: Partial<IRoom>): boolean => isPublicRoom(room);

const filters: Record<string, (room: Partial<IRoom>) => boolean> = {
	private: filterRoomsByPrivate,
	public: filterRoomsByPublic,
};

export const useFilteredVisibilityRooms = (selectedOptions: OptionProp[], isLoading: boolean, rooms?: IRoom[]) => {
	if (isLoading || !rooms) return [];
	if (selectedOptions.length === 0) return rooms;

	let filtered: IRoom[] = [];

	selectedOptions.forEach((option) => {
		filtered = [...new Set([...filtered, ...rooms.filter(filters[option.id])])];
	});

	return filtered;
};
