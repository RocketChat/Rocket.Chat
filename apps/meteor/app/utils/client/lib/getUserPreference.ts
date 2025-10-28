import type { IUser } from '@rocket.chat/core-typings';

import { settings } from '../../../../client/lib/settings';
import { Users } from '../../../../client/stores';

/**
 * Get a user preference
 * @param user The user ID
 * @param key The preference name
 * @returns The preference value
 */
export function getUserPreference<TValue>(user: IUser['_id'] | undefined, key: string): TValue | undefined;
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
export function getUserPreference<TValue>(user: IUser['_id'] | undefined, key: string, defaultValue: TValue): TValue;
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
	const user = typeof userIdOrUser === 'string' ? Users.state.get(userIdOrUser) : userIdOrUser;
	return user?.settings?.preferences?.[key] ?? defaultValue ?? settings.watch(`Accounts_Default_User_Preferences_${key}`);
}
