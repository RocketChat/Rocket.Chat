import type { IUser } from '@rocket.chat/core-typings';

export interface ISetUserAvatarParams {
	user: Pick<IUser, '_id' | 'username'>;
	dataURI: string;
	contentType: string;
	service: 'initials' | 'url' | 'rest' | string;
	etag?: string;
}

export interface IUserService {
	setUserAvatar(param: ISetUserAvatarParams): Promise<void>;
}
