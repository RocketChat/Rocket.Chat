import { api } from '@rocket.chat/core-services';
import type { IUser, UserPresence } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';

import { settings } from '../../settings/cached';

const logger = new Logger('StatusVisibility');

const PRESENCE_FIELDS = { username: 1, status: 1, statusText: 1, statusSource: 1, statusExpiresAt: 1 } as const;

const denied = new Map<IUser['_id'], Set<IUser['_id']>>();

const isStatusVisibilityEnabled = (): boolean => settings.get<boolean>('Accounts_StatusVisibility_Enabled') === true;

export const canSeeStatus = (viewerId: IUser['_id'] | null | undefined, targetId: IUser['_id']): boolean =>
	!isStatusVisibilityEnabled() || !viewerId || viewerId === targetId || !denied.get(targetId)?.has(viewerId);

export const hasStatusRestrictions = (targetId: IUser['_id']): boolean => isStatusVisibilityEnabled() && denied.has(targetId);

export const refreshStatusVisibility = async (targets?: IUser['_id'][]): Promise<UserPresence[]> => {
	if (!isStatusVisibilityEnabled()) {
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

export const convertUsernamesToUserIds = async (usernames: string[]): Promise<IUser['_id'][]> => {
	if (!usernames.length) {
		return [];
	}

	const idByUsername = new Map<NonNullable<IUser['username']>, IUser['_id']>();

	const users = Users.findByUsernames(usernames, { projection: { username: 1 } });
	for await (const { _id, username } of users) {
		if (username) {
			idByUsername.set(username, _id);
		}
	}

	return [...idByUsername.values()];
};

export const convertUserIdsToUsernames = async (ids: IUser['_id'][]): Promise<NonNullable<IUser['username']>[]> => {
	if (!ids.length) {
		return [];
	}

	const usernameById = new Map<IUser['_id'], NonNullable<IUser['username']>>();

	const users = Users.findByIds<Pick<IUser, '_id' | 'username'>>(ids, { projection: { username: 1 } });
	for await (const { _id, username } of users) {
		if (username) {
			usernameById.set(_id, username);
		}
	}

	return [...usernameById.values()];
};

export const redactStatus = <T extends Partial<IUser>>(user: T): T => {
	const redacted: Record<string, unknown> = { ...user, status: 'offline' };

	for (const field of ['statusText', 'statusSource', 'statusExpiresAt', 'statusDefault', 'statusConnection']) {
		delete redacted[field];
	}

	return redacted as T;
};
