import { MeteorError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/model-typings';

import type { SaveUserData } from './saveUser';
import { USER_PROFILE_FIELD_MAX_LENGTH, USER_PROFILE_LANGUAGES_MAX_COUNT } from '../../../../lib/constants';

export const handleProfileFields = (userUpdater: Updater<IUser>, userData: Pick<SaveUserData, 'title' | 'nationality' | 'languages'>) => {
	for (const field of ['title', 'nationality'] as const) {
		const value = userData[field];
		// absent means "don't touch" — only an explicit empty value clears the field
		if (value === undefined) {
			continue;
		}
		if (value?.trim()) {
			if (value.length > USER_PROFILE_FIELD_MAX_LENGTH) {
				throw new MeteorError('error-field-size-exceeded', `${field} size exceeds ${USER_PROFILE_FIELD_MAX_LENGTH} characters`, {
					method: 'saveUser',
				});
			}
			userUpdater.set(field, value.trim());
		} else {
			userUpdater.unset(field);
		}
	}

	if (userData.languages === undefined) {
		return;
	}

	const languages = userData.languages.map((language) => language.trim()).filter(Boolean);
	if (languages.length) {
		if (
			languages.length > USER_PROFILE_LANGUAGES_MAX_COUNT ||
			languages.some((language) => language.length > USER_PROFILE_FIELD_MAX_LENGTH)
		) {
			throw new MeteorError('error-field-size-exceeded', 'languages size exceeded', { method: 'saveUser' });
		}
		userUpdater.set('languages', languages);
	} else {
		userUpdater.unset('languages');
	}
};
