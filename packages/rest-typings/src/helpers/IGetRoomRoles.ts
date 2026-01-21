export interface IGetRoomRoles {
	_id: string;
	rid: string;
	u: {
		_id: string;
		username: string;
	};
	roles: string[];
}
