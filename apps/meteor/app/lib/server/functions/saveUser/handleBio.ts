import { MeteorError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/model-typings';

import type { SaveUserData } from './saveUser';

const MAX_BIO_LENGTH = 260;

export const handleBio = (userUpdater: Updater<IUser>, bio: SaveUserData['bio']) => {
	if (typeof bio === 'string') {
		const trimmedBio = bio.trim();

		if (!trimmedBio) {
			userUpdater.unset('bio');
			return;
		}

		if (trimmedBio.length > MAX_BIO_LENGTH) {
			throw new MeteorError('error-bio-size-exceeded', `Bio size exceeds ${MAX_BIO_LENGTH} characters`, {
				method: 'saveUserProfile',
			});
		}

		userUpdater.set('bio', trimmedBio);
		return;
	}
	userUpdater.unset('bio');
};
