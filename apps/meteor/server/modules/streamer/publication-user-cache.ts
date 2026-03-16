import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { IPublication } from './types';

const CACHE_PROJECTION = { _id: 1, roles: 1 } as const;

/** Cache keyed by publication so entries can be GC'd when the subscription is gone. */
const cacheByPublication = new WeakMap<IPublication, { user: IUser | null; userId: string }>();

/** User ids that received watch.users; next get for a publication with that userId will refetch. */
const invalidatedUserIds = new Set<string>();

export async function getCachedUserForPublication(publication: IPublication): Promise<IUser | null> {
	const userId = publication.userId ?? publication._session?.userId ?? undefined;
	if (userId == null || userId === '') {
		return null;
	}

	const entry = cacheByPublication.get(publication);
	if (entry) {
		if (invalidatedUserIds.has(entry.userId)) {
			const user = await Users.findOneById(entry.userId, { projection: CACHE_PROJECTION });
			const value = user ?? null;
			cacheByPublication.set(publication, { user: value, userId: entry.userId });
			invalidatedUserIds.delete(entry.userId);
			return value;
		}
		return entry.user;
	}

	const user = await Users.findOneById(userId, { projection: CACHE_PROJECTION });
	const value = user ?? null;
	cacheByPublication.set(publication, { user: value, userId });
	return value;
}

export function invalidate(userId: string): void {
	invalidatedUserIds.add(userId);
}
