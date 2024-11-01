import { MeteorError } from '@rocket.chat/core-services';
import type { DeepPartial, DeepWritable, IUser } from '@rocket.chat/core-typings';
import type { UpdateFilter } from 'mongodb';

import type { SaveUserData } from './saveUser';

const MAX_NICKNAME_LENGTH = 120;

export const handleNickname = (updateUser: DeepWritable<UpdateFilter<DeepPartial<IUser>>>, nickname: SaveUserData['nickname']) => {
	if (nickname?.trim()) {
		if (nickname.length > MAX_NICKNAME_LENGTH) {
			throw new MeteorError('error-nickname-size-exceeded', `Nickname size exceeds ${MAX_NICKNAME_LENGTH} characters`, {
				method: 'saveUserProfile',
			});
		}
		updateUser.$set = updateUser.$set || {};
		updateUser.$set.nickname = nickname;
	} else {
		updateUser.$unset = updateUser.$unset || {};
		updateUser.$unset.nickname = 1;
	}
};
