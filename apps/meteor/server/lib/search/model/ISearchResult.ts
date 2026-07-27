import type { IMessage, IRoom, IUser, RoomType } from '@rocket.chat/core-typings';

export type IRawSearchResult = {
	message?: { docs: IMessage[] };
	room?: { docs: IRoom[] };
};

export type ISearchResult = {
	message?: {
		docs: (IMessage & {
			user: IUser['_id'];
			rid: IRoom['_id'];
			r?: {
				name: string | undefined;
				t: RoomType;
			};
			username?: string;
			valid?: boolean;
		})[];
	};
	room?: {
		docs: {
			_id: IRoom['_id'];
			valid?: boolean;
			t?: RoomType;
			name?: string;
		}[];
	};
};
