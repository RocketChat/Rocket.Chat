import { Meteor } from 'meteor/meteor';

import type { ISetUserAvatarParams, IUserService } from '../../sdk/types/IUserService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { setUserAvatar } from '../../../app/lib/server';

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
}
