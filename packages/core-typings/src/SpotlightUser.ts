import type { IUser } from './IUser';

export type SpotlightUser = {
	_id: IUser['_id'];
	username: Required<IUser>['username'];
	nickname: IUser['nickname'];
	name: IUser['name'];
	status: IUser['status'];
	statusText: IUser['statusText'];
	avatarETag: IUser['avatarETag'];
};
