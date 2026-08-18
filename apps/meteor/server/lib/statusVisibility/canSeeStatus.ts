import { api } from '@rocket.chat/core-services';
import type { IUser, UserPresence } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';
import type { FindCursor } from 'mongodb';

import { settings } from '../../settings/cached';

const logger = new Logger('StatusVisibility');

const PRESENCE_FIELDS = { username: 1, status: 1, statusText: 1, statusSource: 1, statusExpiresAt: 1 } as const;

const denied = new Map<IUser['_id'], Set<IUser['_id']>>();

export const canSeeStatus = (viewerId: IUser['_id'] | null | undefined, targetId: IUser['_id']): boolean =>
	!settings.get<boolean>('Accounts_StatusVisibility_Enabled') || !viewerId || viewerId === targetId || !denied.get(targetId)?.has(viewerId);

export const hasStatusRestrictions = (targetId: IUser['_id']): boolean =>
	settings.get<boolean>('Accounts_StatusVisibility_Enabled') && denied.has(targetId);

export const getHiddenFrom = (viewerId: IUser['_id'] | null | undefined): IUser['_id'][] => {
	if (!settings.get<boolean>('Accounts_StatusVisibility_Enabled') || !viewerId) {
		return [];
	}

	return [...denied].filter(([targetId, viewers]) => targetId !== viewerId && viewers.has(viewerId)).map(([targetId]) => targetId);
};

export const refreshStatusVisibility = async (targets?: IUser['_id'][]): Promise<UserPresence[]> => {
	if (!settings.get<boolean>('Accounts_StatusVisibility_Enabled')) {
		const previous = [...denied.keys()];
		denied.clear();
		return previous.length ? Users.findPresenceUsersByIds(previous, { projection: PRESENCE_FIELDS }).toArray() : [];
	}

	const previous = targets ?? [...denied.keys()];

	const users: IUser[] = await Users.findWithStatusVisibilityConfig(targets).toArray();

	if (targets) {
		targets.forEach((uid) => denied.delete(uid));
	} else {
		denied.clear();
	}

	for (const { _id, settings: userSettings } of users) {
		const viewers = userSettings?.preferences?.statusVisibilityDenied;

		if (viewers?.length) {
			denied.set(_id, new Set(viewers));
		}
	}

	const dropped = previous.filter((uid) => !denied.has(uid));

	if (dropped.length) {
		users.push(...(await Users.findPresenceUsersByIds(dropped, { projection: PRESENCE_FIELDS }).toArray()));
	}

	return users;
};

export const broadcastStatusVisibility = (targets?: IUser['_id'][]): void => {
	void api
		.broadcast('presence.invalidateVisibility', { targets })
		.catch((err) => logger.error({ msg: 'Status visibility invalidation failed', err, targets }));
};

type ResolvedUsers = { ids: IUser['_id'][]; usernames: NonNullable<IUser['username']>[] };

const collectUsers = async (users: FindCursor<Pick<IUser, '_id' | 'username'>>): Promise<ResolvedUsers> => {
	const resolved: ResolvedUsers = { ids: [], usernames: [] };

	for await (const { _id, username } of users) {
		if (username) {
			resolved.ids.push(_id);
			resolved.usernames.push(username);
		}
	}

	return resolved;
};

export const resolveUsersByIds = async (ids: IUser['_id'][]): Promise<ResolvedUsers> => {
	if (!ids.length) {
		return { ids: [], usernames: [] };
	}

	return collectUsers(Users.findByIds<Pick<IUser, '_id' | 'username'>>(ids, { projection: { username: 1 } }));
};

export const resolveUsersByUsernames = async (usernames: string[]): Promise<ResolvedUsers> => {
	if (!usernames.length) {
		return { ids: [], usernames: [] };
	}

	return collectUsers(Users.findByUsernames(usernames, { projection: { username: 1 } }));
};

export const redactStatus = <T extends Partial<IUser>>(user: T): T => {
	const { statusText, statusSource, statusExpiresAt, statusDefault, statusConnection, ...rest } = user;

	return { ...rest, status: 'offline' } as T;
};
