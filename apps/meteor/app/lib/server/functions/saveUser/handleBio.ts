import { MeteorError } from '@rocket.chat/core-services';
import type { DeepPartial, DeepWritable, IUser } from '@rocket.chat/core-typings';
import type { UpdateFilter } from 'mongodb';

import type { SaveUserData } from './saveUser';

const MAX_BIO_LENGTH = 260;

export const handleBio = (updateUser: DeepWritable<UpdateFilter<DeepPartial<IUser>>>, bio: SaveUserData['bio']) => {
	if (bio?.trim()) {
		if (bio.length > MAX_BIO_LENGTH) {
			throw new MeteorError('error-bio-size-exceeded', `Bio size exceeds ${MAX_BIO_LENGTH} characters`, {
				method: 'saveUserProfile',
			});
		}
		updateUser.$set = updateUser.$set || {};
		updateUser.$set.bio = bio;
	} else {
		updateUser.$unset = updateUser.$unset || {};
		updateUser.$unset.bio = 1;
	}
};
