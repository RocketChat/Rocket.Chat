import { Settings } from '@rocket.chat/core-services';
import type { IUser, UserPresence } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

const PRESENCE_FIELDS = { username: 1, status: 1, statusText: 1, statusSource: 1, statusExpiresAt: 1 } as const;

// Who each user hides their status from, mirrored in memory to avoid a query per check: this is read
// once per (viewer, target) pair on every presence broadcast. Every process keeps its own copy —
// ddp-streamer compiles this file too — since a synchronous read can only come from local memory.
const hiddenFromByUser = new Map<IUser['_id'], Set<IUser['_id']>>();

// The setting, cached for the same reason: `canSeeStatus` reads it and must return a boolean, not a
// Promise — it runs inside `filter` and inside `UserPresence.run`, an emitter callback returning void.
let featureEnabled = false;

export const canSeeStatus = (viewerId: IUser['_id'] | null | undefined, targetId: IUser['_id']): boolean =>
	!featureEnabled || !viewerId || viewerId === targetId || !hiddenFromByUser.get(targetId)?.has(viewerId);

export const hasStatusRestrictions = (targetId: IUser['_id']): boolean => featureEnabled && hiddenFromByUser.has(targetId);

export const getHiddenFrom = (viewerId: IUser['_id'] | null | undefined): IUser['_id'][] => {
	if (!featureEnabled || !viewerId) {
		return [];
	}

	return [...hiddenFromByUser]
		.filter(([targetId, viewers]) => targetId !== viewerId && viewers.has(viewerId))
		.map(([targetId]) => targetId);
};

export const refreshStatusVisibility = async (targets?: IUser['_id'][]): Promise<UserPresence[]> => {
	featureEnabled = (await Settings.get<boolean>('Accounts_StatusVisibility_Enabled')) === true;

	if (!featureEnabled) {
		const previous = [...hiddenFromByUser.keys()];
		hiddenFromByUser.clear();

		// returns whoever was hidden: the caller re-emits their presence so clients stop showing them offline.
		return previous.length ? Users.findPresenceUsersByIds(previous, { projection: PRESENCE_FIELDS }).toArray() : [];
	}

	const previous = targets ?? [...hiddenFromByUser.keys()];

	const users = await Users.findWithStatusVisibilityConfig(targets).toArray();

	if (targets) {
		targets.forEach((uid) => hiddenFromByUser.delete(uid));
	} else {
		hiddenFromByUser.clear();
	}

	for (const { _id, settings: userSettings } of users) {
		const viewers = userSettings?.preferences?.statusVisibilityDenied;

		if (viewers?.length) {
			hiddenFromByUser.set(_id, new Set(viewers));
		}
	}

	const dropped = previous.filter((uid) => !hiddenFromByUser.has(uid));

	if (dropped.length) {
		users.push(...(await Users.findPresenceUsersByIds(dropped, { projection: PRESENCE_FIELDS }).toArray()));
	}

	return users;
};
