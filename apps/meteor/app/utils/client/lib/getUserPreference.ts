import type { IUser } from '@rocket.chat/core-typings';

import { Users } from '../../../models/client';
import { settings } from '../../../settings/client';

/**
 * Get a user preference
 * @param user The user ID
 * @param key The preference name
 * @returns The preference value
 */
export function getUserPreference<TValue>(user: IUser['_id'] | null | undefined, key: string): TValue | undefined;
/**
 * Get a user preference
 * @param user The user
 * @param key The preference name
 * @returns The preference value
 */
export function getUserPreference<TValue>(user: Pick<IUser, '_id' | 'settings'> | null | undefined, key: string): TValue | undefined;
/**
 * Get a user preference
 * @param user The user ID
 * @param key The preference name
 * @param defaultValue The default value
 * @returns The preference value or the default value
 */
export function getUserPreference<TValue>(user: IUser['_id'] | null | undefined, key: string, defaultValue: TValue): TValue;
/**
 * Get a user preference
 * @param user The user
 * @param key The preference name
 * @param defaultValue The default value
 * @returns The preference value or the default value
 */
export function getUserPreference<TValue>(
	user: Pick<IUser, '_id' | 'settings'> | null | undefined,
	key: string,
	defaultValue: TValue,
): TValue;
export function getUserPreference<TValue>(
	userIdOrUser: IUser['_id'] | Pick<IUser, '_id' | 'settings'> | null | undefined,
	key: string,
	defaultValue?: TValue,
): TValue {
	const user =
		typeof userIdOrUser === 'string' ? Users.findOne(userIdOrUser, { fields: { [`settings.preferences.${key}`]: 1 } }) : userIdOrUser;
	return user?.settings?.preferences?.[key] ?? defaultValue ?? settings.get(`Accounts_Default_User_Preferences_${key}`);
}
