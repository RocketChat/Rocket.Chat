import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { IPublication } from './types';

const CACHE_PROJECTION = { _id: 1, roles: 1 } as const;
const CACHE_TIMEOUT = 1000 * 60;
const cacheByPublication = new Map<string, { user: Pick<IUser, '_id' | 'roles'>; timeout: NodeJS.Timeout }>();

export async function getCachedUserForPublication(publication: IPublication): Promise<Pick<IUser, '_id' | 'roles'> | null> {
	const userId = publication.userId ?? publication._session?.userId ?? undefined;
	if (userId == null || userId === '') {
		return null;
	}

	const entry = cacheByPublication.get(userId);

	if (entry) {
		clearTimeout(entry.timeout);
		entry.timeout = setTimeout(() => {
			cacheByPublication.delete(userId);
		}, CACHE_TIMEOUT);
		return entry.user;
	}

	const user = await Users.findOneById<Pick<IUser, '_id' | 'roles'>>(userId, { projection: CACHE_PROJECTION });
	const value = user ?? null;
	if (value) {
		const timeout = setTimeout(() => {
			cacheByPublication.delete(userId);
		}, CACHE_TIMEOUT);

		cacheByPublication.set(userId, { user: value, timeout });
	}
	return value;
}

export function invalidate(userId: string): void {
	cacheByPublication.delete(userId);
}
