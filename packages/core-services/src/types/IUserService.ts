import type { IUser } from '@rocket.chat/core-typings';

export interface IUserService {
	setRealName(userId: string, name: string, fullUser?: IUser): Promise<IUser | undefined>;
	setUserAvatar(
		user: Pick<IUser, '_id' | 'username'>,
		dataURI: string,
		contentType: string | undefined,
		service?: 'initials' | 'url' | 'rest' | string,
		etag?: string,
	): Promise<void>;
}
