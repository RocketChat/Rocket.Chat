import { createContext } from 'react';

import { IRoom } from '../../../../definition/IRoom';

export type RoomContextValue = {
	rid: IRoom['_id'];
	room: IRoom;
	events: any;
	actions: {
		openUserCard: () => void;
		followMessage: () => void;
		unfollowMessage: () => void;
		openDiscussion: () => void;
		openThread: () => void;
		replyBroadcast: () => void;
	};
	formatters: {
		newDay: (date: Date) => string;
		messageHeader: (date: Date) => string;
	};
	// tabBar: TabBar;
};

export const RoomContext = createContext<RoomContextValue | null>(null);
