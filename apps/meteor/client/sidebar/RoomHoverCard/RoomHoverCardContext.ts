import type { IRoom } from '@rocket.chat/core-typings';
import type { UIEvent } from 'react';
import { createContext, useContext } from 'react';

export type RoomHoverCardContextValue = {
	openRoomHoverCard: (e: UIEvent, rid: IRoom['_id']) => void;
	closeRoomHoverCard: () => void;
};

export const RoomHoverCardContext = createContext<RoomHoverCardContextValue>({
	openRoomHoverCard: () => undefined,
	closeRoomHoverCard: () => undefined,
});

export const useRoomHoverCard = () => useContext(RoomHoverCardContext);
