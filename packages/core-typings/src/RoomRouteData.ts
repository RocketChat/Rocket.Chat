import type { IRoom } from './IRoom';

export type DirectRoomRouteData = (
	| {
			rid: IRoom['_id'];
			name?: IRoom['name'];
	  }
	| {
			name: IRoom['name'];
	  }
) & {
	tab?: string;
};

export type ChannelRouteData = {
	name: IRoom['name'];
	tab?: string;
	context?: string;
};

export type OmnichannelRoomRouteData = {
	rid: IRoom['_id'];
	tab?: string;
};

export type RoomRouteData = DirectRoomRouteData | ChannelRouteData | OmnichannelRoomRouteData;
