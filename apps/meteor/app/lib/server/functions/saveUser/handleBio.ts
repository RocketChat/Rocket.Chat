import { MeteorError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/model-typings';

import type { SaveUserData } from './saveUser';

const MAX_BIO_LENGTH = 260;

export const handleBio = (userUpdater: Updater<IUser>, bio: SaveUserData['bio']) => {
	if (bio?.trim()) {
		if (bio.length > MAX_BIO_LENGTH) {
			throw new MeteorError('error-bio-size-exceeded', `Bio size exceeds ${MAX_BIO_LENGTH} characters`, {
				method: 'saveUserProfile',
			});
		}
		userUpdater.set('bio', bio);
	} else {
		userUpdater.unset('bio');
	}
};
