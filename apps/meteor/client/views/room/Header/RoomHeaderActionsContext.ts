import type { IRoom } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

/** What the room header asks for, carried out by whoever mounts it: favorites, navigation */
export type RoomHeaderActions = {
	toggleFavorite: (room: Pick<IRoom, '_id' | 'name'>, favorite: boolean) => void;
	openRoom: (rid: IRoom['_id']) => void;
	/** Where the room's settings (or its team's info) open, for a link that points there */
	roomSettingsHref: (room: IRoom) => string;
};

const noop = () => undefined;

export const inertRoomHeaderActions: RoomHeaderActions = {
	toggleFavorite: noop,
	openRoom: noop,
	roomSettingsHref: () => '',
};

export const RoomHeaderActionsContext = createContext<RoomHeaderActions>(inertRoomHeaderActions);
RoomHeaderActionsContext.displayName = 'RoomHeaderActions';

export const useRoomHeaderActions = (): RoomHeaderActions => useContext(RoomHeaderActionsContext);
