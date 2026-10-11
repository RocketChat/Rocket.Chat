import { MeteorError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/model-typings';

import type { SaveUserData } from './saveUser';

const MAX_NICKNAME_LENGTH = 120;

export const handleNickname = (userUpdater: Updater<IUser>, nickname: SaveUserData['nickname']) => {
	if (nickname?.trim()) {
		if (nickname.length > MAX_NICKNAME_LENGTH) {
			throw new MeteorError('error-nickname-size-exceeded', `Nickname size exceeds ${MAX_NICKNAME_LENGTH} characters`, {
				method: 'saveUserProfile',
			});
		}
		userUpdater.set('nickname', nickname);
	} else {
		userUpdater.unset('nickname');
	}
};
