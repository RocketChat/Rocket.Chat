import { MeteorError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/model-typings';

import type { SaveUserData } from './saveUser';
import { USER_PROFILE_FIELD_MAX_LENGTH, USER_PROFILE_LANGUAGES_MAX_COUNT } from '../../../../lib/constants';

export type ProfileField = 'title' | 'nationality' | 'languages';

type ProfileFieldsData = Pick<SaveUserData, ProfileField>;

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
 *
 * Values are checked as received (before trim/dedup) so this matches the REST
 * schema bounds exactly: every entrypoint — the ajv-guarded endpoints and the
 * schema-less DDP method — rejects the same inputs. Normalization only ever
 * shrinks the values, so anything that passes here still fits once stored.
 */
export const validateProfileFields = (userData: ProfileFieldsData, method = 'saveUser'): void => {
	for (const field of ['title', 'nationality'] as const) {
		const value = userData[field];
		// undefined = don't touch, null = clear — neither needs a size check
		if (value === undefined || value === null) {
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

	if (userData.languages !== undefined && userData.languages !== null) {
		if (!Array.isArray(userData.languages) || userData.languages.some((language) => typeof language !== 'string')) {
			throw new MeteorError('error-invalid-field', 'languages', { method });
		}
		if (
			userData.languages.length > USER_PROFILE_LANGUAGES_MAX_COUNT ||
			userData.languages.some((language) => language.length > USER_PROFILE_FIELD_MAX_LENGTH)
		) {
			throw new MeteorError('error-field-size-exceeded', 'languages size exceeded', { method });
		}
	}
};

/**
 * Applies the profile fields to the updater.
 *
 * @returns the fields that ended up cleared ($unset), so the caller can mirror
 * them in the `watch.users` notification — the raw `null`/`''`/`[]` in the
 * request must not reach connected clients as the new value.
 */
export const handleProfileFields = (userUpdater: Updater<IUser>, userData: ProfileFieldsData): ProfileField[] => {
	validateProfileFields(userData);

	const cleared: ProfileField[] = [];

	for (const field of ['title', 'nationality'] as const) {
		const value = userData[field];
		// absent means "don't touch"; null or an empty string clears the field
		if (value === undefined) {
			continue;
		}
		if (value && value.trim()) {
			userUpdater.set(field, value.trim());
		} else {
			userUpdater.unset(field);
			cleared.push(field);
		}
	}

	if (userData.languages === undefined) {
		return cleared;
	}

	const languages = userData.languages ? normalizeLanguages(userData.languages) : [];
	if (languages.length) {
		userUpdater.set('languages', languages);
	} else {
		userUpdater.unset('languages');
		cleared.push('languages');
	}

	return cleared;
};
