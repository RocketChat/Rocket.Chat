import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { IUserService } from '@rocket.chat/core-services';

import { _setRealName, setUserAvatar } from '../../../app/lib/server';

export class UserService extends ServiceClassInternal implements IUserService {
	protected name = 'user';

	async setRealName(userId: string, name: string, fullUser?: IUser | undefined): Promise<IUser | undefined> {
		return _setRealName(userId, name, fullUser);
	}

	async setUserAvatar(
		user: Pick<IUser, '_id' | 'username'>,
		dataURI: string,
		contentType: string | undefined,
		service?: string | undefined,
		etag?: string | undefined,
	): Promise<void> {
		return setUserAvatar(user, dataURI, contentType, service, etag);
	}
}
