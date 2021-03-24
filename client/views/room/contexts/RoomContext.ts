import { createContext } from 'react';

import { IRoom } from '../../../../definition/IRoom';


export type RoomContextValue = {
	rid: IRoom['_id'];
	room: IRoom;
	// tabBar: TabBar;
}

export const RoomContext = createContext<RoomContextValue | null>(null);
