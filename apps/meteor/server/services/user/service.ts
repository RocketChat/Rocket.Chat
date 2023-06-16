import { Meteor } from 'meteor/meteor';
import type { ISetUserAvatarParams, IUserService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';

import { setUserAvatar } from '../../../app/lib/server';
import { deleteUser as meteorDeleteUser } from '../../../app/lib/server/functions';
import { checkUsernameAvailability } from '../../../app/lib/server/functions/checkUsernameAvailability';

export class UserService extends ServiceClassInternal implements IUserService {
	protected name = 'user';

	constructor() {
		super();
	}

	async setUserAvatar({ user, dataURI, contentType, service, etag }: ISetUserAvatarParams): Promise<void> {
		await Meteor.runAsUser(user._id, async () => {
			await setUserAvatar(user, dataURI, contentType, service, etag);
		});
	}

	async deleteUser(userId: string, confirmRelinquish = false): Promise<void> {
		return meteorDeleteUser(userId, confirmRelinquish);
	}

	async checkUsernameAvailability(username: string): Promise<boolean> {
		return checkUsernameAvailability(username);
	}
}
