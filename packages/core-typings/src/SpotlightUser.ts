import type { IUser } from './IUser';

export type SpotlightUser = {
	_id: IUser['_id'];
	username: NonNullable<IUser['username']>;
	nickname: IUser['nickname'];
	name: IUser['name'];
	status: IUser['status'];
	statusText: IUser['statusText'];
	avatarETag: IUser['avatarETag'];
};
