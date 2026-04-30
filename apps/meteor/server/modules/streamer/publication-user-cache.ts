import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { IPublication } from './types';

type CacheEntry = { user: Pick<IUser, '_id' | 'roles'>; timeout: NodeJS.Timeout };

const CACHE_PROJECTION = { _id: 1, roles: 1 } as const;
const CACHE_TIMEOUT = 1000 * 60;
const cacheByPublication = new Map<string, CacheEntry>();

export async function getCachedUserForPublication(publication: IPublication): Promise<CacheEntry['user'] | null> {
	const userId = publication.userId ?? publication._session?.userId ?? undefined;
	if (userId == null || userId === '') {
		return null;
	}

	const value = invalidate(userId);

	const user = value ?? (await Users.findOneById<CacheEntry['user']>(userId, { projection: CACHE_PROJECTION }));

	if (user) {
		const timeout = setTimeout(() => {
			invalidate(userId);
		}, CACHE_TIMEOUT);

		cacheByPublication.set(userId, { user, timeout });
	}
	return value;
}

export function invalidate(userId: string): CacheEntry['user'] | null {
	const entry = cacheByPublication.get(userId);
	if (entry) {
		clearTimeout(entry.timeout);
		cacheByPublication.delete(userId);
	}
	return entry?.user ?? null;
}
