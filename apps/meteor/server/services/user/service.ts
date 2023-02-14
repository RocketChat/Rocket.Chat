import { Meteor } from 'meteor/meteor';
import type { IUser } from '@rocket.chat/core-typings';

import type { ISetUserAvatarParams, IUserService } from '../../sdk/types/IUserService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { setUserAvatar } from '../../../app/lib/server';
import { checkUsernameAvailability, deleteUser as meteorDeleteUser } from '../../../app/lib/server/functions';

export class UserService extends ServiceClassInternal implements IUserService {
	protected name = 'user';

	constructor() {
		super();
	}

	async setUserAvatar({ user, dataURI, contentType, service, etag }: ISetUserAvatarParams): Promise<void> {
		Meteor.runAsUser(user._id, () => {
			setUserAvatar(user, dataURI, contentType, service, etag);
		});
	}

	async deleteUser(userId: string, confirmRelinquish = false): Promise<void> {
		return meteorDeleteUser(userId, confirmRelinquish);
	}

	async checkUsernameAvailability(username: string): Promise<boolean> {
		return checkUsernameAvailability(username);
	}
}
