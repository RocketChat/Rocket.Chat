import { MeteorError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/model-typings';

import type { SaveUserData } from './saveUser';
import { USER_PROFILE_FIELD_MAX_LENGTH, USER_PROFILE_LANGUAGES_MAX_COUNT } from '../../../../lib/constants';

type ProfileFieldsData = Pick<SaveUserData, 'title' | 'nationality' | 'languages'>;

/** Trims entries, drops empties and case-insensitive duplicates (first casing wins). */
export const normalizeLanguages = (languages: string[]): string[] => {
	const seen = new Set<string>();
	return languages
		.map((language) => language.trim())
		.filter((language) => {
			if (!language || seen.has(language.toLowerCase())) {
				return false;
			}
			seen.add(language.toLowerCase());
			return true;
		});
};

/**
 * Size/type validation for the profile fields, shared by every write path.
 * Runs in validateUserData BEFORE the user document is inserted/updated so a
 * failure cannot leave a half-created user behind.
 */
export const validateProfileFields = (userData: ProfileFieldsData, method = 'saveUser'): void => {
	for (const field of ['title', 'nationality'] as const) {
		const value = userData[field];
		if (value === undefined) {
			continue;
		}
		if (typeof value !== 'string') {
			throw new MeteorError('error-invalid-field', field, { method });
		}
		if (value.length > USER_PROFILE_FIELD_MAX_LENGTH) {
			throw new MeteorError('error-field-size-exceeded', `${field} size exceeds ${USER_PROFILE_FIELD_MAX_LENGTH} characters`, {
				method,
			});
		}
	}

	if (userData.languages !== undefined) {
		if (!Array.isArray(userData.languages) || userData.languages.some((language) => typeof language !== 'string')) {
			throw new MeteorError('error-invalid-field', 'languages', { method });
		}
		const languages = normalizeLanguages(userData.languages);
		if (
			languages.length > USER_PROFILE_LANGUAGES_MAX_COUNT ||
			languages.some((language) => language.length > USER_PROFILE_FIELD_MAX_LENGTH)
		) {
			throw new MeteorError('error-field-size-exceeded', 'languages size exceeded', { method });
		}
	}
};

export const handleProfileFields = (userUpdater: Updater<IUser>, userData: ProfileFieldsData) => {
	validateProfileFields(userData);

	for (const field of ['title', 'nationality'] as const) {
		const value = userData[field];
		// absent means "don't touch" — only an explicit empty value clears the field
		if (value === undefined) {
			continue;
		}
		if (value.trim()) {
			userUpdater.set(field, value.trim());
		} else {
			userUpdater.unset(field);
		}
	}

	if (userData.languages === undefined) {
		return;
	}

	const languages = normalizeLanguages(userData.languages);
	if (languages.length) {
		userUpdater.set('languages', languages);
	} else {
		userUpdater.unset('languages');
	}
};
