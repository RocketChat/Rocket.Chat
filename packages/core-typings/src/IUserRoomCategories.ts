export interface IUserRoomCategory {
	name: string;
	roomIds: string[];
}

export interface IUserRoomCategories {
	_id: string;
	userId: string;
	categories: IUserRoomCategory[];
}
