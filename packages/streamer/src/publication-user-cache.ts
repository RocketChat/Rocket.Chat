import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { IPublication } from './types';

type CachedUser = IUser; // Pick<IUser, '_id' | 'roles'>;

type CacheEntry = {
	user: Promise<CachedUser | null>;
	timeout: NodeJS.Timeout;
};

const CACHE_PROJECTION = { _id: 1, roles: 1 } as const;
const CACHE_TIMEOUT = 1000 * 60;
const cacheByUserId = new Map<string, CacheEntry>();

export function getCachedUserForPublication(publication: IPublication): Promise<CachedUser | null> {
	const userId = publication.userId ?? publication._session?.userId;
	if (!userId) {
		return Promise.resolve(null);
	}

	const existing = cacheByUserId.get(userId);
	if (existing) {
		return existing.user;
	}

	const userPromise = Users.findOneById<CachedUser>(userId, { projection: CACHE_PROJECTION });

	const timeout = setTimeout(() => {
		invalidate(userId);
	}, CACHE_TIMEOUT);

	cacheByUserId.set(userId, { user: userPromise, timeout });

	userPromise.then(
		(user: CachedUser | null) => {
			if (!user) {
				invalidate(userId);
			}
		},
		() => invalidate(userId),
	);

	return userPromise;
}

export function invalidate(userId: string): void {
	const entry = cacheByUserId.get(userId);
	if (!entry) {
		return;
	}
	clearTimeout(entry.timeout);
	cacheByUserId.delete(userId);
}
